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
    void checkAndResetBuses(schoolId)
  }, [])

  const lockMain =
    location.pathname === '/students' ||
    location.pathname === '/bus' ||
    location.pathname === '/class'

  return (
    <div className="app-shell">
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
