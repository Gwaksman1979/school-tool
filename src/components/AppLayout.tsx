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

  const mainClass = [
    'app-main',
    isSettings
      ? 'app-main--settings'
      : isBus && bannerVisible
        ? 'app-main--bus-banner'
        : isBus
          ? 'app-main--bus'
          : 'app-main--default',
  ].join(' ')

  return (
    <div className="app-shell">
      <TopBar />
      <main className={mainClass}>
        <Outlet />
      </main>
      {!isSettings && !isBus && <BusCallBanner />}
      {!isSettings && !bannerVisible && <BusCallFAB />}
      {!isSettings && (
        <div className="app-bottom-dock">
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
