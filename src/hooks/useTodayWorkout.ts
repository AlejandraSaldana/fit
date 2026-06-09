import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Workout, Exercise } from '../lib/supabase'

type WorkoutWithExercises = Workout & { exercises: Exercise[] }

export function useTodayWorkout(userId: string, date: string, refreshKey?: number) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)

      // Fetch the workout for this date
      const { data, error: err } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises ( * )
        `)
        .eq('user_id', userId)
        .eq('scheduled_date', date)
        .eq('status', 'planned')
        .order('order_index', { referencedTable: 'exercises', ascending: true })
        .maybeSingle()

      if (!mounted) return

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      if (!data) {
        setWorkout(null)
        setExercises([])
        setLoading(false)
        return
      }

      const row = data as WorkoutWithExercises

      // Verify the parent plan is still active — guards against workouts
      // that belong to deleted or inactive plans showing on the Today view
      const { data: planData } = await supabase
        .from('plans')
        .select('status')
        .eq('id', row.plan_id)
        .maybeSingle()

      if (!mounted) return

      const planStatus = (planData as { status: string } | null)?.status
      if (planStatus !== 'active') {
        setWorkout(null)
        setExercises([])
        setLoading(false)
        return
      }

      setWorkout(row)
      setExercises(row.exercises ?? [])
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [userId, date, refreshKey])

  return { workout, exercises, loading, error }
}
