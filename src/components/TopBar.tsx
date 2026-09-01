import { useLocation, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../lib/page-title'
import { BackIcon, BusIcon, ClassIcon, GearIcon } from './icons'

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { title } = usePageTitle()
  const isSettings = location.pathname === '/settings'

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/bus')
  }

  return (
    <header
      dir="ltr"
      className="app-top-bar flex items-end justify-center px-4 pb-2 text-white"
      style={{ backgroundColor: '#0d9488' }}
    >
      {isSettings ? (
        <button
          type="button"
          aria-label="\u05d7\u05d6\u05e8\u05d4"
          onClick={goBack}
          className="absolute left-2 flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-white hover:bg-white/10"
        >
          <BackIcon className="h-6 w-6" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="\u05d4\u05d2\u05d3\u05e8\u05d5\u05ea"
          onClick={() => navigate('/settings')}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
        >
          <GearIcon />
        </button>
      )}
      <h1 dir="rtl" className="flex max-w-[70%] items-center gap-2 truncate text-lg font-semibold">
        {location.pathname === '/bus' && <BusIcon className="h-5 w-5 shrink-0" />}
        {location.pathname === '/class' && <ClassIcon className="h-5 w-5 shrink-0" />}
        <span className="truncate">{title}</span>
      </h1>
    </header>
  )
}
