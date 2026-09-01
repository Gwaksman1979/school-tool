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
        \ud83d\udce2
      </span>
      <p dir="rtl" className="flex-1 text-center text-xl font-bold text-white">
        !\u05e7\u05d5 {busLabel ?? ''} \u05d4\u05d2\u05d9\u05e2
      </p>
    </button>
  )
}
