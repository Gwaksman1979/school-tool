import { useMemo } from 'react'
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
        const done = isBusDone(students, bus.id)
        const fill = departed ? '#1A2030' : done ? '#005bb5' : '#0071e3'
        return (
          <button
            key={bus.id}
            type="button"
            data-bus-id={bus.id}
            onClick={() => onSelect(bus.id)}
            aria-label={`קו ${bus.label}`}
            aria-pressed={selected}
            className={`flex-none flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white whitespace-nowrap${departed ? ' opacity-50' : ''}`}
            style={{
              backgroundColor: fill,
              border: selected ? '2px solid #fff' : '2px solid transparent',
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
