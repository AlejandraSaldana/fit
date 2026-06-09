import { useState, useEffect } from 'react'
import { Home, Calendar, Activity, User } from 'lucide-react'
import { BottomTabBar, TabItem } from './components/layout/BottomTabBar'
import { TodayPage } from './pages/TodayPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { PlanManagementPage } from './pages/PlanManagementPage'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'

const TABS: TabItem[] = [
  { key: 'today',    label: 'Today',    Icon: Home },
  { key: 'calendar', label: 'Calendar', Icon: Calendar },
  { key: 'plan',     label: 'Plan',     Icon: Activity },
  { key: 'profile',  label: 'Profile',  Icon: User },
]

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

export function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('today')
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false)
  const [planCount, setPlanCount] = useState<number | null>(null)

  useEffect(() => {
    const u = user
    if (!u) return
    supabase
      .from('plans')
      .select('id')
      .eq('user_id', u.id)
      .then(({ data }) => setPlanCount(data?.length ?? 0))
  }, [user])

  function refreshPlans() {
    const u = user
    if (!u) return
    supabase
      .from('plans')
      .select('id')
      .eq('user_id', u.id)
      .then(({ data }) => setPlanCount(data?.length ?? 0))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="bg-bg min-h-screen font-sans">
      <div
        className="max-w-[430px] mx-auto px-5 pt-14"
        style={{ paddingBottom: 'max(128px, calc(96px + env(safe-area-inset-bottom)))' }}
      >
        {activeTab === 'today'    && <TodayPage user={user} onLogSheetChange={setIsLogSheetOpen} />}
        {activeTab === 'calendar' && <Placeholder label="Calendar" />}
        {activeTab === 'plan'     && (
          planCount === null
            ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )
            : (
              <PlanManagementPage
                user={user}
                onPlanChange={refreshPlans}
              />
            )
        )}
        {activeTab === 'profile'  && <ProfilePage user={user} />}
      </div>

      {!isLogSheetOpen && (
        <BottomTabBar tabs={TABS} activeKey={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  )
}
