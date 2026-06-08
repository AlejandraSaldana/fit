import { useState } from 'react'
import { Card } from './components/ui/Card'
import { Button } from './components/ui/Button'
import { ProgressRing } from './components/ui/ProgressRing'
import { BottomTabBar, TabItem } from './components/layout/BottomTabBar'

// Inline SVG icon stubs — replace with lucide-react when building screens
function HomeIcon({ size = 22, strokeWidth = 1.6, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function CalendarIcon({ size = 22, strokeWidth = 1.6, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function ActivityIcon({ size = 22, strokeWidth = 1.6, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

const TABS: TabItem[] = [
  { key: 'home',     label: 'Today',    Icon: HomeIcon },
  { key: 'plan',     label: 'Plan',     Icon: CalendarIcon },
  { key: 'progress', label: 'Progress', Icon: ActivityIcon },
]

export function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="min-h-screen bg-bg font-sans">
      <div className="max-w-sm mx-auto px-4 pt-14 space-y-6 pb-32">

        <h1 className="text-hero text-ink">Design System</h1>
        <p className="text-sm text-muted">Component preview — Ale's fitness app</p>

        {/* Cards */}
        <section className="space-y-3">
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Cards</p>
          <Card variant="default">
            <p className="text-sm text-ink font-semibold">Default card</p>
            <p className="text-xs text-muted mt-1">Background #FAF9F6 · shadow-card</p>
          </Card>
          <Card variant="featured">
            <p className="text-sm font-semibold">Featured card</p>
            <p className="text-xs opacity-80 mt-1">Accent blue · white text</p>
          </Card>
          <Card variant="glass">
            <p className="text-sm text-ink font-semibold">Glass card</p>
            <p className="text-xs text-muted mt-1">backdrop-blur · frosted</p>
          </Card>
        </section>

        {/* Buttons */}
        <section className="space-y-3">
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Buttons</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Start run</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="destructive">Delete</Button>
          </div>
          <div className="flex gap-3">
            <Button size="sm" variant="primary">Small</Button>
            <Button size="lg" variant="ghost">Large ghost</Button>
          </div>
        </section>

        {/* Progress rings */}
        <section className="space-y-3">
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Progress Ring</p>
          <div className="flex gap-6 items-center">
            <ProgressRing progress={72}>
              <span className="text-sm font-semibold text-ink">72%</span>
            </ProgressRing>
            <ProgressRing progress={40} size={72} strokeWidth={6}>
              <span className="text-xs font-semibold text-ink">40%</span>
            </ProgressRing>
            <ProgressRing progress={100} size={56} strokeWidth={5} color="#16A34A" />
          </div>
        </section>

      </div>

      <BottomTabBar tabs={TABS} activeKey={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
