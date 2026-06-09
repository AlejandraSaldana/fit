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
      } else {
        const row = data as WorkoutWithExercises
        setWorkout(row)
        setExercises(row.exercises ?? [])
      }
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [userId, date, refreshKey])

  return { workout, exercises, loading, error }
}
