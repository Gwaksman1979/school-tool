import { useBusCall } from '../lib/bus-call'

export default function BusCallBanner() {
  const { isVisible, busLabel, dismiss } = useBusCall()

  if (!isVisible) return null

  return (
    <button
      type="button"
      dir="ltr"
      onClick={dismiss}
      className="app-bus-banner-slot bus-call-banner flex h-[68px] w-full items-center px-4 text-white"
      style={{ backgroundColor: '#ef4444' }}
    >
      <span className="text-[40px] leading-none" aria-hidden="true">
        📢
      </span>
      <p dir="rtl" className="flex-1 text-center text-xl font-bold text-white">
        !קו {busLabel ?? ''} הגיע
      </p>
    </button>
  )
}
