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
  const isBus = location.pathname === '/bus'

  return (
    <div className="app-shell">
      <TopBar
        buses={isBus ? chrome?.buses : undefined}
        selectedBusId={chrome?.selectedBusId}
        onSelectBus={chrome?.onSelectBus}
      />
      <main className="app-main">
        <Outlet />
      </main>
      {isBus && chrome?.departed && (
        <div className="flex h-9 shrink-0 items-center justify-center border-t-2 border-[#0d9488] bg-white text-sm font-semibold text-[#0d9488]">
          הסעה יצאה
        </div>
      )}
      {!isSettings && !bannerVisible && (
        <BusCallFAB isBus={isBus} departedStrip={Boolean(isBus && chrome?.departed)} />
      )}
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
      <BusChromeProvider>
        <BusCallProvider>
          <AppShell />
        </BusCallProvider>
      </BusChromeProvider>
    </PageTitleProvider>
  )
}
