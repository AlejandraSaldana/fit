import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { User as UserIcon, Bell, LogOut, ChevronRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { useUserStats } from '../hooks/useUserStats'

interface ProfilePageProps {
  user: User
}

export function ProfilePage({ user }: ProfilePageProps) {
  const avatarLetter = user.email?.[0]?.toUpperCase() ?? '?'
  const whoopConnected = false

  const { totalWorkouts, weeklyWorkouts, totalDistanceKm, loading } = useUserStats(user.id)

  const [planName, setPlanName] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('plans')
      .select('name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const row = (data as Array<{ name: string }> | null)?.[0]
        if (row?.name) setPlanName(row.name)
      })
  }, [user.id])

  const distanceLabel =
    totalDistanceKm < 1 && totalDistanceKm > 0
      ? `${Math.round(totalDistanceKm * 1000)}m`
      : `${totalDistanceKm}km`

  const spinner = (
    <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin mx-auto" />
  )

  return (
    <div>

      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center">
          <span className="text-title font-bold text-accent uppercase">{avatarLetter}</span>
        </div>
        <p className="text-sm text-muted text-center mt-2">{user.email}</p>
        <p className="text-xs text-muted text-center">{planName ?? 'No active plan'}</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mt-6">
        <Card variant="default" className="flex-1 p-4 text-center">
          {loading ? spinner : (
            <p className="text-title font-bold text-ink">{totalWorkouts}</p>
          )}
          <p className="text-xs text-muted">workouts</p>
        </Card>
        <Card variant="default" className="flex-1 p-4 text-center">
          {loading ? spinner : (
            <p className="text-title font-bold text-ink">{weeklyWorkouts}</p>
          )}
          <p className="text-xs text-muted">this week</p>
        </Card>
        <Card variant="default" className="flex-1 p-4 text-center">
          {loading ? spinner : (
            <p className="text-title font-bold text-ink">{distanceLabel}</p>
          )}
          <p className="text-xs text-muted">total distance</p>
        </Card>
      </div>

      {/* WHOOP Connection Card */}
      <Card variant="default" className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">WHOOP</p>
          {whoopConnected ? (
            <span className="bg-green-50 text-green-700 rounded-full text-xs px-2.5 py-1">
              Connected
            </span>
          ) : (
            <span className="bg-border text-muted rounded-full text-xs px-2.5 py-1">
              Not connected
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-1">
          Connect your WHOOP to sync recovery data
        </p>
        <Button variant="ghost" size="sm" className="mt-3 w-full">
          Connect WHOOP
        </Button>
      </Card>

      {/* Settings */}
      <p className="text-xs uppercase tracking-wider text-muted mt-6 mb-2">Settings</p>

      <Card
        variant="default"
        className="p-4 flex items-center justify-between mb-2 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <UserIcon size={18} className="text-muted" />
          <p className="text-sm text-ink">Edit profile</p>
        </div>
        <ChevronRight size={16} className="text-muted" />
      </Card>

      <Card
        variant="default"
        className="p-4 flex items-center justify-between mb-2 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-muted" />
          <p className="text-sm text-ink">Notifications</p>
        </div>
        <ChevronRight size={16} className="text-muted" />
      </Card>

      <Card
        variant="default"
        className="p-4 flex items-center gap-3 mb-2 cursor-pointer"
        onClick={() => supabase.auth.signOut()}
      >
        <LogOut size={18} className="text-danger" />
        <p className="text-sm text-danger">Sign out</p>
      </Card>

      {/* App version */}
      <p className="text-xs text-muted text-center mt-8">Fit v0.1.0</p>

    </div>
  )
}
