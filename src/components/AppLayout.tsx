import { Outlet, useLocation } from 'react-router-dom'
import { BusCallProvider, useBusCall } from '../lib/bus-call'
import { BusChromeProvider, useBusChrome } from '../lib/bus-chrome'
import { PageTitleProvider } from '../lib/page-title'
import BottomNav from './BottomNav'
import BusCallBanner from './BusCallBanner'
import BusCallFAB from './BusCallFAB'
import TopBar from './TopBar'

function AppShell() {
  const location = useLocation()
  const { isVisible: bannerVisible } = useBusCall()
  const { chrome } = useBusChrome()
  const isSettings = location.pathname === '/settings'

  return (
    <div className="app-shell">
      <TopBar
        dropdownItems={chrome?.dropdownItems}
        onDropdownSelect={chrome?.onDropdownSelect}
        selectedId={chrome?.selectedId}
      />
      <main className="app-main">
        <Outlet />
      </main>
      {!isSettings && !bannerVisible && <BusCallFAB />}
      {!isSettings && (
        <div className="app-bottom-dock">
          {bannerVisible && <BusCallBanner />}
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
        <BusCallProvider>
          <AppShell />
        </BusCallProvider>
      </BusChromeProvider>
    </PageTitleProvider>
  )
}
