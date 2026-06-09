import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Workout, Exercise } from '../lib/supabase'

type WorkoutWithExercises = Workout & { exercises: Exercise[] }

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useTodayWorkout(userId: string) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const today = toDateString(new Date())

    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises ( * )
        `)
        .eq('user_id', userId)
        .eq('scheduled_date', today)
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
  }, [userId])

  return { workout, exercises, loading, error }
}
