import { Outlet, useLocation } from 'react-router-dom'
import { BusCallProvider, useBusCall } from '../lib/bus-call'
import { PageTitleProvider } from '../lib/page-title'
import BottomNav from './BottomNav'
import BusCallBanner from './BusCallBanner'
import BusCallFAB from './BusCallFAB'
import TopBar from './TopBar'

function AppShell() {
  const location = useLocation()
  const { isVisible: bannerVisible } = useBusCall()
  const isSettings = location.pathname === '/settings'
  const isBus = location.pathname === '/bus'

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <Outlet />
      </main>
      {!isSettings && !bannerVisible && <BusCallFAB isBus={isBus} />}
      {!isSettings && (
        <div className="app-bottom-dock">
          {bannerVisible && <BusCallBanner />}
          <div id="bus-pills-slot" />
          <BottomNav />
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  return (
    <PageTitleProvider>
      <BusCallProvider>
        <AppShell />
      </BusCallProvider>
    </PageTitleProvider>
  )
}
