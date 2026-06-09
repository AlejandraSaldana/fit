import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Moon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'
import { useTodayWorkout } from '../hooks/useTodayWorkout'
import { useWhoopRecovery } from '../hooks/useWhoopRecovery'
import { useUserStats } from '../hooks/useUserStats'
import { supabase } from '../lib/supabase'
import type { Workout, Exercise, WhoopRecovery, Plan } from '../lib/supabase'
import { LogWorkoutPage } from './LogWorkoutPage'

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_TODAY = {
  whoop: {
    connected: true,
    recoveryScore: 74,
    sleepPerformance: 81,
    hrv: 62,
    restingHR: 48,
    strain: 8.4,
    status: 'Normal Training' as const,
  },
  workout: {
    name: 'Strength + Easy Run',
    durationMins: 75,
    type: 'gym' as const,
    coachNote:
      'Focus on form today. Keep the run conversational — this is recovery work, not a test.',
    exercises: [
      { id: '1', name: 'Leg Press',             sets: 4, reps: 6,  targetWeight: 185 },
      { id: '2', name: 'Romanian Deadlift',      sets: 3, reps: 8,  targetWeight: 95  },
      { id: '3', name: 'Bulgarian Split Squat',  sets: 3, reps: 8,  targetWeight: 40  },
      { id: '4', name: 'Calf Raises',            sets: 4, reps: 15, targetWeight: 60  },
    ],
    run: {
      type: 'easy',
      distance: '3km',
      duration: '18–22 min',
      paceTarget: '6:00–7:20/km',
      note: 'Straight after gym. Walk the first 2 minutes.',
    },
  },
}

// ── Display types ──────────────────────────────────────────────────────────
type DisplayExercise = { id: string; name: string; sets: number; reps: number; targetWeight: number }

type DisplayWorkout = {
  name: string
  durationMins: number
  type: string
  coachNote: string
  exercises: DisplayExercise[]
  run: typeof MOCK_TODAY.workout.run
}

type DisplayRecovery = {
  connected: boolean
  recoveryScore: number
  sleepPerformance: number
  hrv: number
  restingHR: number
  strain: number
  status: string
}

// ── Date helpers ───────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getWeekDates(anchor: Date): Date[] {
  const monday = getMondayOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getWeekNumber(startDateStr: string): number {
  const start = new Date(startDateStr + 'T00:00:00')
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}

// ── Adapters ───────────────────────────────────────────────────────────────
function toDisplayWorkout(w: Workout, exs: Exercise[]): DisplayWorkout {
  return {
    name: w.name,
    durationMins: w.duration_mins ?? 60,
    type: w.type,
    coachNote: w.coach_note ?? '',
    exercises: exs.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets ?? 0,
      reps: ex.reps ?? 0,
      targetWeight:
        ex.target_weight_kg != null
          ? Math.round(Number(ex.target_weight_kg) * 2.20462)
          : 0,
    })),
    run: MOCK_TODAY.workout.run,
  }
}

function recoveryStatusLabel(score: number): string {
  if (score >= 70) return 'Normal Training'
  if (score >= 40) return 'Light Training'
  return 'Rest Day'
}

function toDisplayRecovery(r: WhoopRecovery): DisplayRecovery {
  const score = r.recovery_score ?? 0
  return {
    connected: true,
    recoveryScore: score,
    sleepPerformance: r.sleep_performance ?? 0,
    hrv: r.hrv_ms != null ? Math.round(Number(r.hrv_ms)) : 0,
    restingHR: r.resting_hr ?? 0,
    strain: r.strain_score != null ? Number(r.strain_score) : 0,
    status: recoveryStatusLabel(score),
  }
}

// ── Display helpers ────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatGoalTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const SHORT_DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function recoveryColor(score: number): string {
  if (score >= 70) return 'bg-green-50 text-green-700'
  if (score >= 40) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

function workoutTypeLabel(type: string): string {
  const map: Record<string, string> = {
    gym: 'Gym',
    run: 'Run',
    gym_run: 'Gym + Run',
    time_trial: 'Time Trial',
    rest: 'Rest',
    mobility: 'Mobility',
    recovery: 'Recovery',
    cross_training: 'Cross Training',
    intervals: 'Intervals',
    tempo: 'Tempo Run',
    long_run: 'Long Run',
    easy_run: 'Easy Run',
  }
  return map[type] ?? type.replace(/_/g, ' ')
}

function computeGoalProgress(
  startDate: string,
  endDate: string,
): { daysUntilTest: number; completionPct: number } {
  const today = new Date()
  const end = new Date(endDate)
  const start = new Date(startDate)
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = Math.max(0, today.getTime() - start.getTime())
  const completionPct = totalMs > 0 ? Math.min(100, Math.round((elapsedMs / totalMs) * 100)) : 0
  const daysUntilTest = Math.max(
    0,
    Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  )
  return { daysUntilTest, completionPct }
}

// ── 1. PageHeader ──────────────────────────────────────────────────────────
function PageHeader({
  selectedDate,
  weekNumber,
  phaseName,
}: {
  selectedDate: Date
  weekNumber: number
  phaseName: string
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">Week {weekNumber}</p>
      <h1 className="text-title font-semibold text-ink mt-0.5">
        {formatDate(selectedDate)}
      </h1>
      <p className="text-xs text-muted mt-0.5">{phaseName}</p>
    </div>
  )
}

// ── 2. DaySelector ─────────────────────────────────────────────────────────
interface DaySelectorProps {
  weekDates: Date[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

function DaySelector({ weekDates, selectedDate, onSelectDate }: DaySelectorProps) {
  const selectedStr = toDateStr(selectedDate)

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
      <div className="flex gap-1 w-max">
        {weekDates.map((date, i) => {
          const dateStr = toDateStr(date)
          const active = dateStr === selectedStr
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className="relative flex items-center justify-center cursor-pointer select-none focus-visible:outline-none"
            >
              {active && (
                <motion.span
                  layoutId="day-pill"
                  className="absolute inset-0 bg-ink rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={[
                  'relative z-10 px-3 py-1 text-xs font-semibold',
                  active ? 'text-white' : 'text-muted',
                ].join(' ')}
              >
                {SHORT_DAY[i]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 3. GoalCard ────────────────────────────────────────────────────────────
function GoalCard({ plan }: { plan: Plan }) {
  const { daysUntilTest, completionPct } = computeGoalProgress(
    plan.start_date ?? '2026-06-10',
    plan.end_date ?? '2026-08-03',
  )

  return (
    <Card variant="default">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-muted flex-shrink-0">Goal</p>
        <p className="text-title font-semibold text-ink truncate">
          {plan.goal ?? 'Fitness Goal'}
        </p>
      </div>

      <div className="flex gap-6 mt-4">
        {plan.goal_time_seconds != null && (
          <div>
            <p className="text-xs text-muted">Target</p>
            <p className="text-sm font-semibold text-accent mt-0.5">
              {formatGoalTime(plan.goal_time_seconds)}
            </p>
          </div>
        )}
        {plan.current_pb_seconds != null && (
          <div>
            <p className="text-xs text-muted">Current PB</p>
            <p className="text-sm font-semibold text-ink mt-0.5">
              {formatGoalTime(plan.current_pb_seconds)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="h-1.5 bg-border rounded-full">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-xs text-muted">{daysUntilTest} days until test</p>
          <p className="text-xs text-accent">{completionPct}% complete</p>
        </div>
      </div>
    </Card>
  )
}

// ── 4. WhoopRecoveryCard ───────────────────────────────────────────────────
function WhoopRecoveryCard({ displayRecovery }: { displayRecovery: DisplayRecovery }) {
  if (!displayRecovery.connected) return null

  return (
    <Card variant="default">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Recovery</p>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${recoveryColor(displayRecovery.recoveryScore)}`}
        >
          {displayRecovery.status}
        </span>
      </div>

      <p className="text-title font-bold text-ink mt-1">{displayRecovery.recoveryScore}</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted">Sleep</p>
          <p className="text-sm font-semibold text-ink">{displayRecovery.sleepPerformance}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">HRV</p>
          <p className="text-sm font-semibold text-ink">{displayRecovery.hrv}ms</p>
        </div>
        <div>
          <p className="text-xs text-muted">Resting HR</p>
          <p className="text-sm font-semibold text-ink">{displayRecovery.restingHR}bpm</p>
        </div>
        <div>
          <p className="text-xs text-muted">Strain</p>
          <p className="text-sm font-semibold text-ink">{displayRecovery.strain}</p>
        </div>
      </div>
    </Card>
  )
}

// ── 5. WorkoutCard ─────────────────────────────────────────────────────────
function WorkoutCard({
  displayWorkout,
  onStart,
  isFuture,
  selectedDate,
}: {
  displayWorkout: DisplayWorkout
  onStart: () => void
  isFuture: boolean
  selectedDate: Date
}) {
  return (
    <Card variant="default" className="shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-border text-muted rounded-full px-3 py-1">
          {workoutTypeLabel(displayWorkout.type)}
        </span>
        <span className="text-xs text-muted">{displayWorkout.durationMins} min</span>
      </div>

      <p className="text-title font-semibold text-ink mt-3">{displayWorkout.name}</p>

      <div className="border-l-2 border-accent pl-3 mt-3">
        <p className="text-sm text-muted italic">{displayWorkout.coachNote}</p>
      </div>

      <Button
        variant={isFuture ? 'ghost' : 'primary'}
        size="lg"
        className="w-full mt-5"
        onClick={onStart}
        disabled={isFuture}
      >
        {isFuture ? 'Scheduled' : 'Start Workout'}
      </Button>
      {isFuture && (
        <p className="text-xs text-muted text-center mt-2">
          Available on {formatDate(selectedDate)}
        </p>
      )}
    </Card>
  )
}

// ── 5a. WorkoutSkeleton ────────────────────────────────────────────────────
function WorkoutSkeleton() {
  return <div className="bg-border rounded-2xl h-40 animate-pulse" />
}

// ── 5b. RestDayCard ────────────────────────────────────────────────────────
function RestDayCard({
  selectedDate,
  previousWorkoutName,
}: {
  selectedDate: Date
  previousWorkoutName: string | null
}) {
  const REST_MESSAGES = [
    previousWorkoutName
      ? `You put in the work with ${previousWorkoutName}. The couch is your training partner today.`
      : 'Nothing on the schedule today. The couch is your training partner.',
    'Recovery is where adaptation happens. Trust the rest.',
    previousWorkoutName
      ? `After ${previousWorkoutName}, your legs have earned this.`
      : 'Legs up. Body adapting. This is part of the plan.',
    'Champions are built on rest days, not despite them.',
    'Sleep more. Eat well. The training will be there tomorrow.',
    previousWorkoutName
      ? `You showed up for ${previousWorkoutName}. Let your body absorb it.`
      : 'Active recovery counts. A walk, a stretch — keep it light.',
    'No workout today. But you can prep your kit for tomorrow.',
    "Rest is not weakness. It's the other half of training.",
    'Foam roll, hydrate, sleep. Repeat.',
    'The best athletes in the world prioritise rest. So should you.',
    previousWorkoutName
      ? `${previousWorkoutName} was real work. Today's work is to recover.`
      : 'Easy day. Your nervous system will thank you.',
    'Patience is a training skill. Practice it today.',
  ]

  const dayOfYear = Math.floor(
    (selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  )
  const message = REST_MESSAGES[dayOfYear % REST_MESSAGES.length]

  return (
    <Card variant="default">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-border flex items-center justify-center flex-shrink-0">
          <Moon size={18} className="text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Rest Day</p>
          <p className="text-xs text-muted mt-0.5">{formatDate(selectedDate)}</p>
        </div>
      </div>

      <p className="text-sm text-muted mt-4">{message}</p>

      <div className="border-t border-border mt-4 pt-4">
        <p className="text-xs text-muted">
          {previousWorkoutName ? `Yesterday: ${previousWorkoutName}` : 'Back at it tomorrow.'}
        </p>
      </div>
    </Card>
  )
}

// ── 6. ExerciseList ────────────────────────────────────────────────────────
function ExerciseList({ exercises }: { exercises: typeof MOCK_TODAY.workout.exercises }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Exercises</p>
      {exercises.map((ex) => {
        const expanded = expandedIds.has(ex.id)
        return (
          <Card
            key={ex.id}
            variant="default"
            className="py-4 px-5 cursor-pointer"
            onClick={() => toggle(ex.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{ex.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {ex.sets} × {ex.reps} · {ex.targetWeight} lb
                </p>
              </div>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={18} className="text-muted" />
              </motion.div>
            </div>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="sets"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-t border-border mt-3 pt-3 space-y-2">
                    {Array.from({ length: ex.sets }, (_, i) => i + 1).map((setNum) => (
                      <div key={setNum} className="flex items-center gap-3">
                        <p className="text-xs text-muted w-10">Set {setNum}</p>
                        <input
                          type="number"
                          defaultValue={ex.targetWeight}
                          className="w-16 text-center text-sm border border-border rounded-md h-9 bg-bg focus:outline-none focus:border-accent"
                          aria-label={`${ex.name} set ${setNum} weight`}
                        />
                        <span className="text-xs text-muted">lb</span>
                        <input
                          type="number"
                          defaultValue={ex.reps}
                          className="w-16 text-center text-sm border border-border rounded-md h-9 bg-bg focus:outline-none focus:border-accent"
                          aria-label={`${ex.name} set ${setNum} reps`}
                        />
                        <span className="text-xs text-muted">reps</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )
      })}
    </div>
  )
}

// ── 7. RunSection ──────────────────────────────────────────────────────────
function RunSection() {
  const { run } = MOCK_TODAY.workout
  return (
    <Card variant="default">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-accent-light text-accent rounded-full px-3 py-1">
          Easy Run
        </span>
        <span className="text-sm font-semibold text-ink">{run.distance}</span>
      </div>

      <div className="flex gap-8 mt-4">
        <div>
          <p className="text-xs text-muted">Duration</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{run.duration}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Pace</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{run.paceTarget}</p>
        </div>
      </div>

      <div className="border-l-2 border-accent pl-3 mt-4">
        <p className="text-sm text-muted italic">{run.note}</p>
      </div>
    </Card>
  )
}

// ── 8. StreakCard + PhaseCard ──────────────────────────────────────────────
function BottomCards({
  streak,
  longestStreak,
  activePlan,
  weekNumber,
  phaseName,
}: {
  streak: number
  longestStreak: number
  activePlan: Plan | null | undefined
  weekNumber: number
  phaseName: string
}) {
  const totalWeeks =
    activePlan?.start_date && activePlan?.end_date
      ? Math.ceil(
          (new Date(activePlan.end_date + 'T00:00:00').getTime() -
            new Date(activePlan.start_date + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24 * 7),
        )
      : 8
  const phaseProgress = Math.min(100, Math.round((weekNumber / totalWeeks) * 100))

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <Card variant="default" className="p-4">
          <p className="text-title font-bold text-ink">{streak}</p>
          <p className="text-xs text-muted">day streak</p>
          <p className="text-xs text-muted mt-2">Best: {longestStreak}</p>
        </Card>
      </div>

      <div className="flex-1">
        <Card variant="default" className="p-4 flex flex-col items-center">
          <ProgressRing progress={phaseProgress} size={56} strokeWidth={5} />
          <p className="text-xs font-semibold text-ink mt-2">{phaseName}</p>
          <p className="text-xs text-muted">Wk {weekNumber} of {totalWeeks}</p>
        </Card>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
interface TodayPageProps {
  user: User
  onLogSheetChange?: (open: boolean) => void
}

export function TodayPage({ user, onLogSheetChange }: TodayPageProps) {
  // Anchor: start of plan (Jun 10) if today is before it, otherwise today
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return new Date() < new Date('2026-06-10')
      ? new Date('2026-06-10')
      : new Date()
  })

  const anchorDate = new Date() < new Date('2026-06-10')
    ? new Date('2026-06-10')
    : new Date()
  const weekDates = getWeekDates(anchorDate)

  const [showLogSheet, setShowLogSheet] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Active plan — fetched fresh on every mount (tab switch remounts this component)
  const [activePlan, setActivePlan] = useState<Plan | null | undefined>(undefined)

  // Current phase name — fetched from the next upcoming planned workout
  const [currentPhase, setCurrentPhase] = useState('Training')

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setActivePlan((data as Plan[] | null)?.[0] ?? null)
      })
  }, [user.id])

  // Fetch the current phase name from the next upcoming workout
  useEffect(() => {
    if (!activePlan) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as unknown as { from: (t: string) => any }
    db
      .from('workouts')
      .select('phase_id, phases(name)')
      .eq('user_id', user.id)
      .eq('status', 'planned')
      .gte('scheduled_date', toDateStr(new Date()))
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .then(({ data }: { data: Array<{ phases: { name: string } | null }> | null }) => {
        const phaseName = data?.[0]?.phases?.name
        if (phaseName) setCurrentPhase(phaseName)
      })
  }, [activePlan, user.id])

  useEffect(() => {
    onLogSheetChange?.(showLogSheet)
  }, [showLogSheet, onLogSheetChange])

  const stats = useUserStats(user.id, refreshKey)

  const { workout, exercises, loading: workoutLoading } = useTodayWorkout(
    user.id,
    toDateStr(selectedDate),
    refreshKey,
  )

  // Yesterday's workout for the RestDayCard message
  const yesterdayDate = new Date(selectedDate)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const { workout: yesterdayWorkout } = useTodayWorkout(user.id, toDateStr(yesterdayDate))

  const { recovery } = useWhoopRecovery(user.id)

  const displayWorkout: DisplayWorkout =
    workout != null
      ? toDisplayWorkout(workout, exercises)
      : MOCK_TODAY.workout

  const displayRecovery: DisplayRecovery =
    recovery != null
      ? toDisplayRecovery(recovery)
      : MOCK_TODAY.whoop

  const todayStr = toDateStr(new Date())
  const isFuture = toDateStr(selectedDate) > todayStr

  const weekNumber = activePlan
    ? getWeekNumber(activePlan.start_date ?? '2026-06-10')
    : 1

  return (
    <div className="space-y-4">
      <PageHeader
        selectedDate={selectedDate}
        weekNumber={weekNumber}
        phaseName={currentPhase}
      />
      <DaySelector
        weekDates={weekDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Workout section — before WHOOP */}
      {workoutLoading ? (
        <WorkoutSkeleton />
      ) : workout === null ? (
        <RestDayCard
          selectedDate={selectedDate}
          previousWorkoutName={yesterdayWorkout?.name ?? null}
        />
      ) : (
        <>
          <WorkoutCard
            displayWorkout={displayWorkout}
            onStart={() => setShowLogSheet(true)}
            isFuture={isFuture}
            selectedDate={selectedDate}
          />
          {displayWorkout.exercises.length > 0 && (
            <ExerciseList exercises={displayWorkout.exercises} />
          )}
          {['run', 'gym_run', 'time_trial'].includes(workout.type) && <RunSection />}
        </>
      )}

      {/* Goal card — only shown when there is an active plan */}
      {activePlan != null && <GoalCard plan={activePlan} />}

      <WhoopRecoveryCard displayRecovery={displayRecovery} />

      <BottomCards
        streak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        activePlan={activePlan}
        weekNumber={weekNumber}
        phaseName={currentPhase}
      />

      {workout && (
        <LogWorkoutPage
          isOpen={showLogSheet}
          onClose={() => setShowLogSheet(false)}
          onComplete={() => {
            setShowLogSheet(false)
            setRefreshKey((k) => k + 1)
          }}
          user={user}
          workout={{
            id: workout.id,
            name: displayWorkout.name,
            type: displayWorkout.type,
            exercises: displayWorkout.exercises,
            run: (['run', 'gym_run', 'time_trial'] as string[]).includes(workout.type)
              ? {
                  type: workout.type,
                  distance: workout.type === 'time_trial' ? '1km' : '3km',
                  duration: `${workout.duration_mins ?? 30} min`,
                  paceTarget: workout.type === 'time_trial' ? 'sub 3:30' : 'conversational',
                }
              : null,
          }}
          stats={{
            streak: stats.currentStreak,
            daysUntilGoal: stats.daysUntilGoal,
            completionPct: stats.completionPct,
            weeklyWorkouts: stats.weeklyWorkouts,
            weeklyTarget: stats.weeklyTarget,
          }}
        />
      )}
    </div>
  )
}
