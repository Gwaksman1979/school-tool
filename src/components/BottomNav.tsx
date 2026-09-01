import { NavLink } from 'react-router-dom'
import { BusIcon, ClassIcon, StudentsIcon } from './icons'

const TABS = [
  { to: '/class', label: 'כיתה', icon: ClassIcon },
  { to: '/bus', label: 'אוטובוס', icon: BusIcon },
  { to: '/students', label: 'תלמידים', icon: StudentsIcon },
] as const

export default function BottomNav() {
  return (
    <nav className="app-bottom-nav flex items-center justify-center px-3">
      <div className="flex h-14 w-full items-center justify-around rounded-full bg-white px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className="flex h-12 w-14 items-center justify-center"
            >
              {({ isActive }) => (
                <span
                  className={
                    isActive
                      ? 'flex h-10 w-10 items-center justify-center rounded-full bg-[#0d9488] text-white'
                      : 'flex h-10 w-10 items-center justify-center rounded-full text-[#0d9488]'
                  }
                >
                  <Icon className="h-6 w-6" />
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
