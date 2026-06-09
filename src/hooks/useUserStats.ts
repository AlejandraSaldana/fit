import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserStats {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  totalDistanceKm: number
  weeklyWorkouts: number
  weeklyTarget: number
  daysUntilGoal: number
  completionPct: number
  loading: boolean
}

const DEFAULT_STATS: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalWorkouts: 0,
  totalDistanceKm: 0,
  weeklyWorkouts: 0,
  weeklyTarget: 0,
  daysUntilGoal: 0,
  completionPct: 0,
  loading: true,
}

// ── Date helpers ───────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayStr(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return toDateStr(date)
}

function getSundayStr(mondayStr: string): string {
  const d = new Date(mondayStr + 'T00:00:00')
  d.setDate(d.getDate() + 6)
  return toDateStr(d)
}

// ── Streak helpers ─────────────────────────────────────────────────────────

function computeCurrentStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0
  const check = new Date()
  // If today has no session yet, allow streak to count from yesterday
  if (!dates.has(toDateStr(check))) {
    check.setDate(check.getDate() - 1)
  }
  let streak = 0
  while (dates.has(toDateStr(check))) {
    streak++
    check.setDate(check.getDate() - 1)
  }
  return streak
}

function computeLongestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0
  const sorted = Array.from(dates).sort()
  let longest = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diffDays === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useUserStats(userId: string, refreshKey?: number): UserStats {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)

  useEffect(() => {
    let mounted = true

    async function load() {
      setStats((s) => ({ ...s, loading: true }))

      const today = new Date()
      const mondayStr = getMondayStr(today)
      const sundayStr = getSundayStr(mondayStr)

      const [sessionsRes, runRes, planRes, weekRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('completed_at, workout_id')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
        supabase
          .from('run_results')
          .select('distance_meters')
          .eq('user_id', userId),
        supabase
          .from('plans')
          .select('end_date, start_date, goal_time_seconds')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('workouts')
          .select('scheduled_date, type, status')
          .eq('user_id', userId)
          .gte('scheduled_date', mondayStr)
          .lte('scheduled_date', sundayStr),
      ])

      if (!mounted) return

      // ── Streak ───────────────────────────────────────────────────────────
      const sessionDates = new Set(
        ((sessionsRes.data ?? []) as Array<{ completed_at: string }>).map((s) =>
          s.completed_at.slice(0, 10),
        ),
      )
      const currentStreak = computeCurrentStreak(sessionDates)
      const longestStreak = computeLongestStreak(sessionDates)
      const totalWorkouts = (sessionsRes.data ?? []).length

      // ── Weekly stats ─────────────────────────────────────────────────────
      const weekRows = (weekRes.data ?? []) as Array<{ type: string; status: string }>
      const weeklyWorkouts = weekRows.filter((w) => w.status === 'completed').length
      const weeklyTarget = weekRows.filter(
        (w) => w.type !== 'rest' && w.status !== 'cancelled',
      ).length

      // ── Distance ─────────────────────────────────────────────────────────
      const runRows = (runRes.data ?? []) as Array<{ distance_meters: number | null }>
      const totalDistanceKm =
        Math.round(
          (runRows.reduce((sum, r) => sum + (r.distance_meters ?? 0), 0) / 1000) * 10,
        ) / 10

      // ── Goal progress ─────────────────────────────────────────────────────
      const plan = planRes.data as {
        end_date: string | null
        start_date: string | null
      } | null
      let daysUntilGoal = 0
      let completionPct = 0
      if (plan?.end_date) {
        const end = new Date(plan.end_date + 'T00:00:00')
        const start = plan.start_date
          ? new Date(plan.start_date + 'T00:00:00')
          : new Date('2026-06-10')
        const totalMs = end.getTime() - start.getTime()
        const elapsedMs = Math.max(0, today.getTime() - start.getTime())
        completionPct =
          totalMs > 0 ? Math.min(100, Math.round((elapsedMs / totalMs) * 100)) : 0
        daysUntilGoal = Math.max(
          0,
          Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        )
      }

      setStats({
        currentStreak,
        longestStreak,
        totalWorkouts,
        totalDistanceKm,
        weeklyWorkouts,
        weeklyTarget,
        daysUntilGoal,
        completionPct,
        loading: false,
      })
    }

    void load()
    return () => { mounted = false }
  }, [userId, refreshKey])

  return stats
}
