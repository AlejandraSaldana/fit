import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { BottomSheet } from '../components/ui/BottomSheet'
import { RPESlider } from '../components/ui/RPESlider'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import type { ExerciseSetInsert } from '../lib/supabase'
import { runResultSchema, recoveryReflectionSchema, sanitizeText } from '../lib/validation'

// ── Types ──────────────────────────────────────────────────────────────────
interface LogWorkoutPageProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  user: User
  workout: {
    id: string
    name: string
    type: string
    exercises: Array<{
      id: string
      name: string
      sets: number
      reps: number
      targetWeight: number
    }>
    run?: {
      type: string
      distance: string
      duration: string
      paceTarget: string
    } | null
  }
}

type SetData = { weight: number; reps: number }
type ExerciseSets = Record<string, Record<number, SetData>>

type ReflectionState = {
  rpe: number
  energy: number
  mood: number
  sleep: number
  pain: number
  notes: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPace(totalSeconds: number, distanceKm: number): string {
  if (distanceKm <= 0 || !isFinite(totalSeconds / distanceKm)) return '--:--'
  const paceSeconds = Math.round(totalSeconds / distanceKm)
  const mins = Math.floor(paceSeconds / 60)
  const secs = paceSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function initExerciseSets(
  exercises: LogWorkoutPageProps['workout']['exercises'],
): ExerciseSets {
  const init: ExerciseSets = {}
  for (const ex of exercises) {
    init[ex.id] = {}
    for (let s = 1; s <= ex.sets; s++) {
      init[ex.id][s] = { weight: ex.targetWeight, reps: ex.reps }
    }
  }
  return init
}

// ── Component ──────────────────────────────────────────────────────────────
export function LogWorkoutPage({
  isOpen,
  onClose,
  onComplete,
  user,
  workout,
}: LogWorkoutPageProps) {
  // ── Derived config ───────────────────────────────────────────────────────
  const hasRun = workout.run != null && workout.type.includes('run')
  const totalSteps = hasRun ? 3 : 2

  // Step numbering: 1 = exercises, 2 = run (if hasRun), 3 = reflection
  // With no run: step 1 → step 3 (skip 2)
  function getDotIndex(s: number): number {
    if (s === 1) return 0
    if (s === 2) return 1          // only reachable when hasRun
    return hasRun ? 2 : 1          // step 3
  }

  const stepTitles: Record<number, string> = {
    1: 'Log Exercises',
    2: 'Log Run',
    3: 'How did it go?',
  }

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [exerciseSets, setExerciseSets] = useState<ExerciseSets>(() =>
    initExerciseSets(workout.exercises),
  )
  const [runDistance, setRunDistance] = useState(3)
  const [runMinutes, setRunMinutes] = useState(20)
  const [runRpe, setRunRpe] = useState(6)
  const [reflection, setReflection] = useState<ReflectionState>({
    rpe: 7,
    energy: 7,
    mood: 7,
    sleep: 7,
    pain: 1,
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reset to step 1 each time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setError(null)
      setSubmitting(false)
      setExerciseSets(initExerciseSets(workout.exercises))
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Updaters ─────────────────────────────────────────────────────────────
  function updateSet(
    exerciseId: string,
    setNum: number,
    field: 'weight' | 'reps',
    val: number,
  ) {
    setExerciseSets((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setNum]: {
          ...prev[exerciseId]?.[setNum],
          [field]: val,
        },
      },
    }))
  }

  function updateReflection(field: keyof ReflectionState, val: number | string) {
    setReflection((prev) => ({ ...prev, [field]: val }))
  }

  function nextStep() {
    setStep((s) => {
      if (s === 1) return hasRun ? 2 : 3
      if (s === 2) return 3
      return s
    })
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleComplete() {
    // 1. Validate reflection
    const reflectionResult = recoveryReflectionSchema.safeParse({
      rpe: reflection.rpe,
      energyLevel: reflection.energy,
      mood: reflection.mood,
      sleepQuality: reflection.sleep,
      painLevel: reflection.pain,
      notes: reflection.notes || undefined,
    })
    if (!reflectionResult.success) {
      setError('Please check your inputs before saving.')
      return
    }

    setSubmitting(true)
    setError(null)

    // Our Database type omits Update/Relationships fields that supabase-js v2
    // generics require for write operations — cast for the write path only.
    // Read operations in hooks remain fully typed.
    const db = supabase as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (table: string) => any
    }

    // 2. Insert workout_session
    const { data: rawSession, error: sessionErr } = await db
      .from('workout_sessions')
      .insert({
        workout_id: workout.id,
        user_id: user.id,
        rpe: reflection.rpe,
        energy_level: reflection.energy,
        mood: reflection.mood,
        sleep_quality: reflection.sleep,
        pain_level: reflection.pain,
        notes: reflection.notes || null,
      })
      .select()
      .single()

    const session = rawSession as { id: string } | null
    if (sessionErr || !session) {
      setError((sessionErr as { message?: string } | null)?.message ?? 'Failed to save session.')
      setSubmitting(false)
      return
    }

    // 3. Insert exercise sets
    const setsArray: ExerciseSetInsert[] = []
    for (const [exerciseId, sets] of Object.entries(exerciseSets)) {
      for (const [setNumStr, setData] of Object.entries(sets)) {
        if (setData.weight > 0 && setData.reps > 0) {
          setsArray.push({
            session_id: session.id,
            exercise_id: exerciseId,
            set_number: Number(setNumStr),
            weight_kg: setData.weight / 2.20462,  // lbs → kg for storage
            reps_completed: setData.reps,
          })
        }
      }
    }
    if (setsArray.length > 0) {
      await db.from('exercise_sets').insert(setsArray)
    }

    // 4. Insert run result (only if run step was shown and has valid data)
    if (hasRun && runDistance > 0 && runMinutes > 0) {
      const durationSeconds = Math.round(runMinutes * 60)
      const runResult = runResultSchema.safeParse({
        distanceMeters: Math.round(runDistance * 1000),
        durationSeconds,
        avgPaceSeconds: Math.round(durationSeconds / runDistance),
        rpe: runRpe,
      })
      if (runResult.success) {
        await db.from('run_results').insert({
          session_id: session.id,
          user_id: user.id,
          run_type: workout.run?.type ?? 'easy',
          distance_meters: Math.round(runDistance * 1000),
          duration_seconds: durationSeconds,
          avg_pace_seconds: Math.round(durationSeconds / runDistance),
          rpe: runRpe,
        })
      }
    }

    // 5. Mark workout completed
    await db
      .from('workouts')
      .update({ status: 'completed' })
      .eq('id', workout.id)
      .eq('user_id', user.id)

    setSubmitting(false)
    onComplete()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const dotIndex = getDotIndex(step)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={stepTitles[step]}>

      {/* Step indicator */}
      <div className="flex justify-center gap-1.5 mb-5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
              i === dotIndex ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Exercises ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6 pb-2">
          {workout.exercises.map((ex) => (
            <div key={ex.id}>
              <p className="text-sm font-semibold text-ink mb-3">{ex.name}</p>
              <div className="space-y-2">
                {Array.from({ length: ex.sets }, (_, i) => i + 1).map((setNum) => {
                  const setData = exerciseSets[ex.id]?.[setNum]
                  return (
                    <div key={setNum} className="flex items-center gap-3">
                      <p className="text-xs text-muted" style={{ minWidth: 40 }}>
                        Set {setNum}
                      </p>
                      <input
                        type="number"
                        value={setData?.weight ?? ex.targetWeight}
                        onChange={(e) =>
                          updateSet(ex.id, setNum, 'weight', Number(e.target.value))
                        }
                        className="w-16 text-center text-sm border border-border rounded-xl h-10 bg-bg focus:outline-none focus:border-accent"
                        aria-label={`${ex.name} set ${setNum} weight`}
                      />
                      <span className="text-xs text-muted">lb</span>
                      <input
                        type="number"
                        value={setData?.reps ?? ex.reps}
                        onChange={(e) =>
                          updateSet(ex.id, setNum, 'reps', Number(e.target.value))
                        }
                        className="w-16 text-center text-sm border border-border rounded-xl h-10 bg-bg focus:outline-none focus:border-accent"
                        aria-label={`${ex.name} set ${setNum} reps`}
                      />
                      <span className="text-xs text-muted">reps</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <Button variant="primary" size="lg" className="w-full mt-2" onClick={nextStep}>
            Next
          </Button>
        </div>
      )}

      {/* ── Step 2: Run ───────────────────────────────────────────────────── */}
      {step === 2 && hasRun && workout.run && (
        <div className="space-y-5 pb-2">
          {/* Target info */}
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted">Target distance</p>
              <p className="text-sm font-semibold text-ink mt-0.5">{workout.run.distance}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Target pace</p>
              <p className="text-sm font-semibold text-ink mt-0.5">{workout.run.paceTarget}</p>
            </div>
          </div>

          {/* Distance */}
          <div>
            <p className="text-sm text-ink mb-1">Distance (km)</p>
            <input
              type="number"
              step="0.01"
              value={runDistance}
              onChange={(e) => setRunDistance(Number(e.target.value))}
              className="w-full text-sm border border-border rounded-xl h-10 bg-bg px-4 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Time */}
          <div>
            <p className="text-sm text-ink mb-1">Time (minutes)</p>
            <input
              type="number"
              step="0.1"
              value={runMinutes}
              onChange={(e) => setRunMinutes(Number(e.target.value))}
              className="w-full text-sm border border-border rounded-xl h-10 bg-bg px-4 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Computed pace (read-only) */}
          <div>
            <p className="text-xs text-muted">Average pace</p>
            <p className="text-sm font-semibold text-ink mt-0.5">
              {formatPace(runMinutes * 60, runDistance)} /km
            </p>
          </div>

          <RPESlider
            label="How hard was it?"
            value={runRpe}
            onChange={setRunRpe}
          />

          <Button variant="primary" size="lg" className="w-full mt-2" onClick={nextStep}>
            Next
          </Button>
        </div>
      )}

      {/* ── Step 3: Reflection ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5 pb-2">
          <RPESlider label="Effort"             value={reflection.rpe}    onChange={(v) => updateReflection('rpe', v)}    />
          <RPESlider label="Energy"             value={reflection.energy} onChange={(v) => updateReflection('energy', v)} />
          <RPESlider label="Mood"               value={reflection.mood}   onChange={(v) => updateReflection('mood', v)}   />
          <RPESlider label="Sleep last night"   value={reflection.sleep}  onChange={(v) => updateReflection('sleep', v)}  />
          <RPESlider label="Pain / discomfort"  value={reflection.pain}   onChange={(v) => updateReflection('pain', v)}   min={1} max={10} />

          <textarea
            value={reflection.notes}
            placeholder="Anything to note about today's session..."
            onChange={(e) => updateReflection('notes', sanitizeText(e.target.value))}
            className="w-full border border-border rounded-xl bg-bg px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none h-24"
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleComplete}
            disabled={submitting}
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Complete Workout'
            )}
          </Button>

          {error && <p className="text-xs text-danger mt-2">{error}</p>}
        </div>
      )}

    </BottomSheet>
  )
}
