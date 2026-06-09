import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ParsedPlan, ParsedWorkout } from '../lib/parsePlan'

// ── Types ──────────────────────────────────────────────────────────────────

export interface ImportProgress {
  phase:
    | 'idle'
    | 'inserting_plan'
    | 'inserting_phases'
    | 'inserting_workouts'
    | 'inserting_exercises'
    | 'done'
    | 'error'
  message: string
  workoutsInserted: number
  totalWorkouts: number
  error: string | null
}

const INITIAL_PROGRESS: ImportProgress = {
  phase: 'idle',
  message: '',
  workoutsInserted: 0,
  totalWorkouts: 0,
  error: null,
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useImportPlan(user: User) {
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS)

  function reset() {
    setProgress(INITIAL_PROGRESS)
  }

  async function importPlan(plan: ParsedPlan): Promise<void> {
    // Our Database type omits Update/Relationships fields that supabase-js v2
    // generics require for write operations — cast for the write path only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as unknown as { from: (t: string) => any }

    // ── Step 1: Check for duplicate plan name ─────────────────────────────
    const { data: existing } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', plan.name)
      .maybeSingle()

    if (existing) {
      setProgress({
        phase: 'error',
        message: '',
        workoutsInserted: 0,
        totalWorkouts: 0,
        error: `A plan named "${plan.name}" already exists. Delete it first.`,
      })
      return
    }

    // ── Step 2: Insert plan ───────────────────────────────────────────────
    setProgress({
      phase: 'inserting_plan',
      message: 'Creating plan...',
      workoutsInserted: 0,
      totalWorkouts: 0,
      error: null,
    })

    const { data: rawPlan, error: planErr } = await db
      .from('plans')
      .insert({
        user_id: user.id,
        name: plan.name,
        goal: plan.goal,
        goal_time_seconds: plan.goal_time_seconds,
        start_date: plan.start_date,
        end_date: plan.end_date,
        status: 'active',
      })
      .select()
      .single()

    const insertedPlan = rawPlan as { id: string } | null
    const planError = planErr as { message: string } | null

    if (planError || !insertedPlan) {
      setProgress({
        phase: 'error',
        message: '',
        workoutsInserted: 0,
        totalWorkouts: 0,
        error: planError?.message ?? 'Failed to create plan.',
      })
      return
    }

    // ── Step 3: Insert phases ─────────────────────────────────────────────
    setProgress({
      phase: 'inserting_phases',
      message: 'Creating phases...',
      workoutsInserted: 0,
      totalWorkouts: 0,
      error: null,
    })

    const phaseIdMap: Record<number, string> = {}

    for (const phase of plan.phases) {
      const { data: rawPhase, error: phaseErr } = await db
        .from('phases')
        .insert({
          plan_id: insertedPlan.id,
          name: phase.name,
          order_index: phase.order_index,
          start_week: null,
          end_week: null,
        })
        .select()
        .single()

      const insertedPhase = rawPhase as { id: string } | null
      const phaseError = phaseErr as { message: string } | null

      if (phaseError || !insertedPhase) {
        setProgress({
          phase: 'error',
          message: '',
          workoutsInserted: 0,
          totalWorkouts: 0,
          error: phaseError?.message ?? 'Failed to create phase.',
        })
        return
      }

      phaseIdMap[phase.order_index] = insertedPhase.id
    }

    // ── Step 4: Insert workouts ───────────────────────────────────────────
    const totalWorkouts = plan.phases.reduce((sum, p) => sum + p.workouts.length, 0)

    setProgress({
      phase: 'inserting_workouts',
      message: 'Creating workouts...',
      workoutsInserted: 0,
      totalWorkouts,
      error: null,
    })

    let workoutsInserted = 0
    const workoutIdMap: Array<{ workout: ParsedWorkout; id: string }> = []

    for (const phase of plan.phases) {
      const phaseId = phaseIdMap[phase.order_index]
      for (const workout of phase.workouts) {
        const { data: rawWorkout, error: workoutErr } = await db
          .from('workouts')
          .insert({
            plan_id: insertedPlan.id,
            phase_id: phaseId,
            user_id: user.id,
            scheduled_date: workout.scheduled_date,
            type: workout.type,
            name: workout.name,
            duration_mins: workout.duration_mins,
            coach_note: workout.coach_note,
            status: 'planned',
          })
          .select()
          .single()

        const insertedWorkout = rawWorkout as { id: string } | null
        const workoutError = workoutErr as { message: string } | null

        if (workoutError || !insertedWorkout) {
          setProgress({
            phase: 'error',
            message: '',
            workoutsInserted,
            totalWorkouts,
            error: workoutError?.message ?? 'Failed to create workout.',
          })
          return
        }

        workoutsInserted++
        setProgress({
          phase: 'inserting_workouts',
          message: `Creating workouts... (${workoutsInserted}/${totalWorkouts})`,
          workoutsInserted,
          totalWorkouts,
          error: null,
        })

        if (workout.exercises.length > 0) {
          workoutIdMap.push({ workout, id: insertedWorkout.id })
        }
      }
    }

    // ── Step 5: Batch-insert exercises per workout ────────────────────────
    setProgress({
      phase: 'inserting_exercises',
      message: 'Creating exercises...',
      workoutsInserted,
      totalWorkouts,
      error: null,
    })

    for (const { workout, id: workoutId } of workoutIdMap) {
      const { error: exErr } = await db
        .from('exercises')
        .insert(
          workout.exercises.map((ex) => ({
            workout_id: workoutId,
            name: ex.name,
            order_index: ex.order_index,
            sets: ex.sets,
            reps: ex.reps,
            target_weight_kg: ex.target_weight_kg,
          })),
        )

      const exError = exErr as { message: string } | null
      if (exError) {
        setProgress({
          phase: 'error',
          message: '',
          workoutsInserted,
          totalWorkouts,
          error: exError.message,
        })
        return
      }
    }

    // ── Step 6: Done ──────────────────────────────────────────────────────
    setProgress({
      phase: 'done',
      message: 'Plan imported successfully!',
      workoutsInserted,
      totalWorkouts,
      error: null,
    })
  }

  return { progress, importPlan, reset }
}
