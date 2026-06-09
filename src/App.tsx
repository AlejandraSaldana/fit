import { useState } from 'react'
import { Home, Calendar, Activity, User } from 'lucide-react'
import { BottomTabBar, TabItem } from './components/layout/BottomTabBar'
import { TodayPage } from './pages/TodayPage'
import { AuthPage } from './pages/AuthPage'
import { useAuth } from './hooks/useAuth'

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
      <div className="max-w-[430px] mx-auto px-5 pt-14 pb-32">
        {activeTab === 'today'    && <TodayPage user={user} />}
        {activeTab === 'calendar' && <Placeholder label="Calendar" />}
        {activeTab === 'plan'     && <Placeholder label="Plan" />}
        {activeTab === 'profile'  && <Placeholder label="Profile" />}
      </div>

      <BottomTabBar tabs={TABS} activeKey={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
