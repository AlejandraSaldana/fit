import { ComponentType } from 'react'

export interface TabItem {
  key: string
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

interface BottomTabBarProps {
  tabs: TabItem[]
  activeKey: string
  onTabChange: (key: string) => void
}

export function BottomTabBar({ tabs, activeKey, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pb-safe pointer-events-none">
      <div className="pointer-events-auto mx-4 mb-3 rounded-2xl tab-bar-blur border border-border shadow-card">
        <nav className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const active = tab.key === activeKey
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex flex-1 flex-col items-center justify-center gap-1',
                  'transition-colors duration-150 select-none cursor-pointer',
                  'focus-visible:outline-none rounded-2xl',
                  active ? 'text-accent' : 'text-muted',
                ].join(' ')}
              >
                <tab.Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.6}
                  className="transition-all duration-150"
                />
                <span
                  className={[
                    'text-xs leading-none font-sans',
                    active ? 'font-semibold' : 'font-normal',
                  ].join(' ')}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
