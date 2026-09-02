import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  isBusDeparted,
  normalizeStatus,
  sortBuses,
  type Bus,
  type Student,
} from '../types'

interface BusPillsProps {
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

export default function BusPills({
  buses,
  students,
  selectedBusId,
  onSelect,
}: BusPillsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const sortedBuses = useMemo(() => sortBuses(buses), [buses])

  useEffect(() => {
    setSlot(document.getElementById('bus-pills-slot'))
  }, [])

  useEffect(() => {
    const selected = scrollerRef.current?.querySelector(
      `[data-bus-id="${selectedBusId}"]`,
    )
    selected?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedBusId])

  if (!slot) return null

  return createPortal(
    <div className="app-bus-pills bg-white py-2">
      <div
        ref={scrollerRef}
        dir="rtl"
        className="flex gap-3 overflow-x-auto px-[10%] [scrollbar-width:none] [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden"
      >
        {sortedBuses.map((bus) => {
          const done = isBusDone(students, bus.id)
          const selected = bus.id === selectedBusId
          const departed = isBusDeparted(bus)
          const icon = departed ? '✓' : done ? '✓' : '←'
          return (
            <button
              key={bus.id}
              type="button"
              data-bus-id={bus.id}
              onClick={() => onSelect(bus.id)}
              className={[
                'flex h-11 w-[22%] min-w-[5rem] shrink-0 snap-center items-center justify-center gap-1.5 rounded-full px-3 text-base font-bold',
                departed
                  ? selected
                    ? 'border-2 border-gray-500 bg-gray-200 text-gray-600'
                    : 'border-2 border-gray-300 bg-gray-200 text-gray-500'
                  : selected
                    ? 'border-2 border-[#0d9488] bg-white text-[#0d9488]'
                    : done
                      ? 'border-2 border-[#0d9488] bg-[#0d9488] text-white'
                      : 'border-2 border-amber-400 bg-amber-400 text-white',
              ].join(' ')}
            >
              <span aria-hidden="true">{icon}</span>
              <span>{bus.label}</span>
            </button>
          )
        })}
      </div>
    </div>,
    slot,
  )
}
