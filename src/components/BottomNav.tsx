import { NavLink } from 'react-router-dom'
import { BusIcon, ClassIcon, StudentsIcon } from './icons'

const TABS = [
  { to: '/class', label: 'כיתות', icon: ClassIcon },
  { to: '/bus', label: 'הסעות', icon: BusIcon },
  { to: '/students', label: 'תלמידים', icon: StudentsIcon },
] as const

export default function BottomNav() {
  return (
    <nav
      className="app-bottom-nav flex justify-around items-center px-2 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]"
      style={{
        background: 'rgba(8,10,18,0.72)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-label={tab.label}
            className="flex h-12 min-w-[4.5rem] items-center justify-center"
          >
            {({ isActive }) => (
              <span className="flex flex-col items-center gap-0.5">
                <Icon
                  className="h-5 w-5"
                  style={{ color: isActive ? '#0071e3' : '#98989d' }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isActive ? '#0071e3' : '#98989d' }}
                >
                  {tab.label}
                </span>
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
