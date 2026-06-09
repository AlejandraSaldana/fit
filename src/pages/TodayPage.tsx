import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_TODAY = {
  week: 3,
  phase: 'Base Rebuild',
  date: new Date(),
  goal: {
    distance: '1km',
    targetTime: '3:30',
    currentPB: '3:52',
    prediction: '3:41',
    daysUntilTest: 23,
    completionPct: 34,
  },
  streak: { current: 6, longest: 11, totalWorkouts: 18, completionRate: 82 },
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

// ── Helpers ────────────────────────────────────────────────────────────────
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

// JS getDay() returns 0=Sun…6=Sat; convert to 0=Mon index
function todayMondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

function recoveryColor(score: number): string {
  if (score >= 70) return 'bg-green-50 text-green-700'
  if (score >= 40) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

// ── 1. PageHeader ──────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">Week {MOCK_TODAY.week}</p>
      <h1 className="text-title font-semibold text-ink mt-0.5">
        {formatDate(MOCK_TODAY.date)}
      </h1>
      <p className="text-xs text-muted mt-0.5">{MOCK_TODAY.phase}</p>
    </div>
  )
}

// ── 2. DaySelector ─────────────────────────────────────────────────────────
function DaySelector() {
  const [selected, setSelected] = useState(todayMondayIndex(MOCK_TODAY.date))

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
      <div className="flex gap-1 w-max">
        {DAY_LABELS.map((label, i) => {
          const active = i === selected
          return (
            <button
              key={label}
              onClick={() => setSelected(i)}
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
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 3. GoalCard ────────────────────────────────────────────────────────────
function GoalCard() {
  const { goal } = MOCK_TODAY
  return (
    <Card variant="default">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted">Goal</p>
        <p className="text-title font-semibold text-ink">
          {goal.distance} in {goal.targetTime}
        </p>
      </div>

      <div className="flex gap-6 mt-4">
        <div>
          <p className="text-xs text-muted">Current PB</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{goal.currentPB}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Prediction</p>
          <p className="text-sm font-semibold text-accent mt-0.5">{goal.prediction}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 bg-border rounded-full">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${goal.completionPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-xs text-muted">{goal.daysUntilTest} days until test</p>
          <p className="text-xs text-accent">{goal.completionPct}% complete</p>
        </div>
      </div>
    </Card>
  )
}

// ── 4. WhoopRecoveryCard ───────────────────────────────────────────────────
function WhoopRecoveryCard() {
  const { whoop } = MOCK_TODAY
  if (!whoop.connected) return null

  return (
    <Card variant="default">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Recovery</p>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${recoveryColor(whoop.recoveryScore)}`}
        >
          {whoop.status}
        </span>
      </div>

      <p className="text-title font-bold text-ink mt-1">{whoop.recoveryScore}</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted">Sleep</p>
          <p className="text-sm font-semibold text-ink">{whoop.sleepPerformance}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">HRV</p>
          <p className="text-sm font-semibold text-ink">{whoop.hrv}ms</p>
        </div>
        <div>
          <p className="text-xs text-muted">Resting HR</p>
          <p className="text-sm font-semibold text-ink">{whoop.restingHR}bpm</p>
        </div>
        <div>
          <p className="text-xs text-muted">Strain</p>
          <p className="text-sm font-semibold text-ink">{whoop.strain}</p>
        </div>
      </div>
    </Card>
  )
}

// ── 5. WorkoutCard ─────────────────────────────────────────────────────────
function WorkoutCard() {
  const { workout } = MOCK_TODAY
  const typeLabel = workout.type === 'gym' ? 'Gym + Run' : workout.type

  return (
    <Card variant="default" className="shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-border text-muted rounded-full px-3 py-1">
          {typeLabel}
        </span>
        <span className="text-xs text-muted">{workout.durationMins} min</span>
      </div>

      <p className="text-title font-semibold text-ink mt-3">{workout.name}</p>

      <div className="border-l-2 border-accent pl-3 mt-3">
        <p className="text-sm text-muted italic">{workout.coachNote}</p>
      </div>

      <Button variant="primary" size="lg" className="w-full mt-5">
        Start Workout
      </Button>
    </Card>
  )
}

// ── 6. ExerciseList ────────────────────────────────────────────────────────
function ExerciseList() {
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
      {MOCK_TODAY.workout.exercises.map((ex) => {
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
function BottomCards() {
  const { streak } = MOCK_TODAY
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <Card variant="default" className="p-4">
          <p className="text-title font-bold text-ink">{streak.current}</p>
          <p className="text-xs text-muted">day streak</p>
          <p className="text-xs text-muted mt-2">Best: {streak.longest}</p>
        </Card>
      </div>

      <div className="flex-1">
        <Card variant="default" className="p-4 flex flex-col items-center">
          <ProgressRing progress={44} size={56} strokeWidth={5} />
          <p className="text-xs font-semibold text-ink mt-2">{MOCK_TODAY.phase}</p>
          <p className="text-xs text-muted">Wk {MOCK_TODAY.week} of 6</p>
        </Card>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export function TodayPage() {
  return (
    <div className="space-y-4">
      <PageHeader />
      <DaySelector />
      <GoalCard />
      <WhoopRecoveryCard />
      <WorkoutCard />
      <ExerciseList />
      <RunSection />
      <BottomCards />
    </div>
  )
}
