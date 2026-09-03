import { Outlet, useLocation } from 'react-router-dom'
import { BusChromeProvider, useBusChrome } from '../lib/bus-chrome'
import { PageTitleProvider } from '../lib/page-title'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

function AppShell() {
  const location = useLocation()
  const { chrome } = useBusChrome()
  const isSettings = location.pathname === '/settings'
  const lockMain =
    location.pathname === '/students' || location.pathname === '/bus'

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
