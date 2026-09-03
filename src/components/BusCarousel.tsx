import { useEffect, useMemo, useRef } from 'react'
import {
  isBusDeparted,
  normalizeStatus,
  sortBuses,
  type Bus,
  type Student,
} from '../types'
import { BusIcon } from './icons'

interface BusCarouselProps {
  buses: Bus[]
  students: Student[]
  selectedBusId: string
  onSelect: (busId: string) => void
}

function busStudents(students: Student[], busId: string): Student[] {
  return students.filter(
    (student) =>
      student.transport_mode === 'bus' &&
      (student.arrival_bus_id === busId || student.departure_bus_id === busId),
  )
}

function isBusDone(students: Student[], busId: string): boolean {
  const riders = busStudents(students, busId)
  if (riders.length === 0) return true
  return riders.every((student) => normalizeStatus(student.current_status) !== 'not_arrived')
}

export default function BusCarousel({
  buses,
  students,
  selectedBusId,
  onSelect,
}: BusCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sortedBuses = useMemo(() => sortBuses(buses), [buses])

  useEffect(() => {
    const selected = scrollerRef.current?.querySelector(
      `[data-bus-id="${selectedBusId}"]`,
    )
    selected?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedBusId])

  return (
    <div
      ref={scrollerRef}
      dir="rtl"
      className="bus-carousel flex items-center gap-3 px-[12%] py-3"
    >
      {sortedBuses.map((bus) => {
        const done = isBusDone(students, bus.id)
        const selected = bus.id === selectedBusId
        const departed = isBusDeparted(bus)
        const fill = departed ? '#1A2030' : done ? '#228B3A' : '#E06818'
        const size = selected ? 92 : 72
        return (
          <button
            key={bus.id}
            type="button"
            data-bus-id={bus.id}
            onClick={() => onSelect(bus.id)}
            aria-label={`קו ${bus.label}`}
            aria-pressed={selected}
            className="flex shrink-0 snap-center flex-col items-center justify-center rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: fill,
              border: departed
                ? '2px solid #2A3448'
                : selected
                  ? '4px solid #FFFFFF'
                  : `2px solid ${fill}`,
              boxShadow: selected ? '0 8px 28px rgba(59,139,255,0.28)' : 'none',
              opacity: departed ? 0.85 : 1,
              transition: 'width 180ms ease, height 180ms ease, box-shadow 180ms ease',
            }}
          >
            <span className="text-xl font-bold leading-none text-white">{bus.label}</span>
            <BusIcon className="mt-1 h-4 w-4 text-white" />
          </button>
        )
      })}
    </div>
  )
}
