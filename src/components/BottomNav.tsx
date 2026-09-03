import { NavLink } from 'react-router-dom'
import { BusIcon, ClassIcon, StudentsIcon } from './icons'

const TABS = [
  { to: '/class', label: 'כיתות', icon: ClassIcon },
  { to: '/bus', label: 'הסעות', icon: BusIcon },
  { to: '/students', label: 'תלמידים', icon: StudentsIcon },
] as const

export default function BottomNav() {
  return (
    <nav className="app-bottom-nav mx-4 flex flex-col items-center pt-2 pb-3">
      <div className="flex h-[58px] w-full items-center justify-around rounded-full bg-[#151A28] px-2">
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
                    style={{ color: isActive ? '#4E9BFF' : '#C3C3C9' }}
                  />
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: isActive ? '#A9CDFF' : '#C3C3C9' }}
                  >
                    {tab.label}
                  </span>
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
