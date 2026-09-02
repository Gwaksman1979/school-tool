import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../lib/page-title'
import { isBusDeparted, type Bus } from '../types'
import { BackIcon, BusIcon, ChevronDownIcon, ClassIcon, GearIcon } from './icons'

interface TopBarProps {
  buses?: Bus[]
  selectedBusId?: string
  onSelectBus?: (busId: string) => void
}

export default function TopBar({ buses, selectedBusId, onSelectBus }: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { title } = usePageTitle()
  const isSettings = location.pathname === '/settings'
  const isBus = location.pathname === '/bus'
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const showBusPicker = isBus && Boolean(buses && buses.length > 0 && onSelectBus)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, selectedBusId])

  useEffect(() => {
    if (!open) return
    function handlePointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [open])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/bus')
  }

  return (
    <header
      dir="ltr"
      className="app-top-bar relative flex items-end justify-center px-4 pb-2 text-white"
      style={{ backgroundColor: '#0d9488' }}
    >
      {isSettings ? (
        <button
          type="button"
          aria-label="חזרה"
          onClick={goBack}
          className="absolute left-2 flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-white hover:bg-white/10"
        >
          <BackIcon className="h-6 w-6" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="הגדרות"
          onClick={() => navigate('/settings')}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
        >
          <GearIcon />
        </button>
      )}
      <div ref={menuRef} className="relative max-w-[70%]">
        {showBusPicker ? (
          <button
            type="button"
            dir="rtl"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="בחירת קו"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-1.5 truncate text-lg font-semibold"
          >
            <BusIcon className="h-5 w-5 shrink-0" />
            <span className="truncate">{title}</span>
            <ChevronDownIcon className="h-4 w-4 shrink-0" />
          </button>
        ) : (
          <h1 dir="rtl" className="flex items-center gap-2 truncate text-lg font-semibold">
            {location.pathname === '/bus' && <BusIcon className="h-5 w-5 shrink-0" />}
            {location.pathname === '/class' && <ClassIcon className="h-5 w-5 shrink-0" />}
            <span className="truncate">{title}</span>
          </h1>
        )}
        {showBusPicker && open && buses && onSelectBus && (
          <ul
            dir="rtl"
            role="listbox"
            className="absolute top-full right-1/2 z-50 mt-2 w-48 max-h-64 translate-x-1/2 overflow-y-auto rounded-xl bg-white py-1 text-gray-900 shadow-lg"
          >
            {buses.map((bus) => (
              <li key={bus.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={bus.id === selectedBusId}
                  onClick={() => {
                    onSelectBus(bus.id)
                    setOpen(false)
                  }}
                  className={[
                    'flex min-h-11 w-full items-center justify-between px-3 text-right text-base',
                    bus.id === selectedBusId
                      ? 'bg-teal-50 font-semibold text-[#0d9488]'
                      : 'hover:bg-gray-50',
                    isBusDeparted(bus) ? 'text-gray-400' : '',
                  ].join(' ')}
                >
                  <span>קו {bus.label}</span>
                  {isBusDeparted(bus) && <span className="text-xs">הסעה יצאה</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  )
}
