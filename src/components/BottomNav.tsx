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
      className="fixed bottom-0 left-0 right-0 z-[25] flex justify-around items-center"
      style={{
        background: 'rgba(20,20,22,0.92)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-label={tab.label}
            className="flex flex-col items-center gap-[3px] no-underline"
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="h-[22px] w-[22px]"
                  style={{ color: isActive ? '#0071e3' : '#98989d' }}
                />
                <span
                  className="text-[11px] text-center"
                  style={{ color: isActive ? '#0071e3' : '#98989d' }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
