import { useMemo } from 'react'
import { isBusDeparted, sortBuses, type Bus, type Student } from '../types'
import { BusIcon } from './icons'

interface BusCarouselProps {
  buses: Bus[]
  students: Student[]
  selectedBusId: string
  onSelect: (busId: string) => void
}

export default function BusCarousel({
  buses,
  selectedBusId,
  onSelect,
}: BusCarouselProps) {
  const sortedBuses = useMemo(() => sortBuses(buses), [buses])

  return (
    <div
      dir="rtl"
      className="flex gap-2 overflow-x-auto px-5 pb-3.5"
      style={{ scrollbarWidth: 'none' }}
    >
      {sortedBuses.map((bus) => {
        const selected = bus.id === selectedBusId
        const departed = isBusDeparted(bus)
        return (
          <button
            key={bus.id}
            type="button"
            data-bus-id={bus.id}
            onClick={() => onSelect(bus.id)}
            aria-label={`קו ${bus.label}`}
            aria-pressed={selected}
            className="flex-none flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap"
            style={{
              background: selected
                ? 'linear-gradient(135deg, #f5a742, #F0A030)'
                : '#2c2c2e',
              color: selected ? '#000000' : '#ffffff',
              border: selected ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
              transform: selected ? 'scale(1.05)' : 'none',
              boxShadow: selected ? '0 0 14px rgba(245,167,66,0.35)' : undefined,
              opacity: departed ? 0.4 : 1,
              transition: 'all 180ms ease',
            }}
          >
            <BusIcon className="h-4 w-4" />
            <span>{bus.label}</span>
          </button>
        )
      })}
    </div>
  )
}
