import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

interface WorkoutCompletePageProps {
  isVisible: boolean
  onDismiss: () => void
  workoutName: string
  stats: {
    streak: number
    daysUntilGoal: number
    completionPct: number
    weeklyWorkouts: number
    weeklyTarget: number
  }
}

function motivationalMessage(streak: number): string {
  if (streak >= 7) return "You're on fire. Keep the momentum going."
  if (streak >= 3) return 'Consistency is building. Great work today.'
  return 'Every session counts. You showed up.'
}

export function WorkoutCompletePage({
  isVisible,
  onDismiss,
  workoutName,
  stats,
}: WorkoutCompletePageProps) {
  const { streak, daysUntilGoal, completionPct, weeklyWorkouts, weeklyTarget } = stats
  const weeklyPct = weeklyTarget > 0 ? (weeklyWorkouts / weeklyTarget) * 100 : 0

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-50 bg-bg flex flex-col"
        >
          <div className="max-w-[390px] mx-auto px-8 flex flex-col justify-between h-full py-16">

            {/* TOP SECTION */}
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto"
              >
                <CheckCircle2 size={40} className="text-white" />
              </motion.div>

              <h1 className="text-hero font-bold text-ink text-center mt-6">
                Workout Complete
              </h1>
              <p className="text-sm text-muted text-center mt-1">{workoutName}</p>
            </div>

            {/* MIDDLE SECTION */}
            <div>
              <div className="grid grid-cols-2 gap-3 mt-10">
                <Card variant="default" className="p-4 text-center">
                  <p className="text-title font-bold text-ink">{streak}</p>
                  <p className="text-xs text-muted mt-1">day streak</p>
                </Card>
                <Card variant="default" className="p-4 text-center">
                  <p className="text-title font-bold text-ink">{daysUntilGoal}</p>
                  <p className="text-xs text-muted mt-1">days to goal</p>
                </Card>
                <Card variant="default" className="p-4 text-center">
                  <p className="text-title font-bold text-ink">
                    {weeklyWorkouts}/{weeklyTarget}
                  </p>
                  <p className="text-xs text-muted mt-1">this week</p>
                </Card>
                <Card variant="default" className="p-4 text-center">
                  <p className="text-title font-bold text-ink">{completionPct}%</p>
                  <p className="text-xs text-muted mt-1">plan complete</p>
                </Card>
              </div>

              {/* Weekly progress bar */}
              <div className="mt-4">
                <div className="flex justify-between">
                  <p className="text-xs text-muted">Weekly progress</p>
                  <p className="text-xs text-accent">{weeklyWorkouts} of {weeklyTarget}</p>
                </div>
                <div className="h-1.5 bg-border rounded-full mt-1.5">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-700"
                    style={{ width: `${weeklyPct}%` }}
                  />
                </div>
              </div>

              {/* Motivational message */}
              <p className="text-sm text-muted text-center italic mt-6">
                {motivationalMessage(streak)}
              </p>
            </div>

            {/* BOTTOM SECTION */}
            <div>
              <Button variant="primary" size="lg" className="w-full" onClick={onDismiss}>
                Back to Today
              </Button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
