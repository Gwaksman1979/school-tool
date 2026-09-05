import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { getSchoolId } from '../lib/auth'
import { BusChromeProvider, useBusChrome } from '../lib/bus-chrome'
import { checkAndResetBuses } from '../lib/bus-reset'
import { PageTitleProvider } from '../lib/page-title'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

const busResetOnce = { current: false }

function AppShell() {
  const location = useLocation()
  const { chrome } = useBusChrome()
  const resetOnceRef = useRef(false)
  const isSettings = location.pathname === '/settings'

  useEffect(() => {
    if (resetOnceRef.current || busResetOnce.current) return
    const schoolId = getSchoolId()
    if (!schoolId) return
    resetOnceRef.current = true
    busResetOnce.current = true
    setTimeout(() => void checkAndResetBuses(schoolId), 3000)
  }, [])

  const lockMain =
    location.pathname === '/students' ||
    location.pathname === '/bus' ||
    location.pathname === '/class'

  return (
    <div className="app-shell">
      <div
        className="pointer-events-none fixed top-0 bottom-0 left-0 z-[5] flex w-8 items-center justify-center"
        style={{ background: 'linear-gradient(to bottom, #3E8EDE, #9B59D0, #E0447C)' }}
        aria-hidden="true"
      >
        <span
          className="text-[10px] font-bold tracking-[0.3em] text-white"
          style={{
            writingMode: 'vertical-lr',
            transform: 'rotate(180deg)',
            fontFamily: '"Montserrat", sans-serif',
            letterSpacing: '0.35em',
            whiteSpace: 'nowrap',
          }}
        >
          NEW MAINSTREAM
        </span>
      </div>
      <TopBar
        dropdownItems={chrome?.dropdownItems}
        onDropdownSelect={chrome?.onDropdownSelect}
        selectedId={chrome?.selectedId}
      />
      <main className={lockMain ? 'app-main app-main--lock' : 'app-main'}>
        <Outlet />
      </main>
      {!isSettings && (
        <div className="app-bottom-dock">
          <BottomNav />
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  return (
    <PageTitleProvider>
      <BusChromeProvider>
        <AppShell />
      </BusChromeProvider>
    </PageTitleProvider>
  )
}
