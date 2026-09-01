import { useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { normalizeStatus, type Bus, type Student } from '../types'

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

  const sortedBuses = useMemo(
    () =>
      [...buses].sort((a, b) =>
        a.label.localeCompare(b.label, 'he', { numeric: true }),
      ),
    [buses],
  )

  function scrollBy(offset: number) {
    scrollerRef.current?.scrollBy({ left: offset, behavior: 'smooth' })
  }

  const slot = document.getElementById('bus-pills-slot')
  if (!slot) return null

  return createPortal(
    <div className="app-bus-pills flex items-center gap-1 bg-white px-1 py-2">
      <button
        type="button"
        aria-label="גלול ימינה"
        onClick={() => scrollBy(160)}
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50"
      >
        ›
      </button>
      <div
        ref={scrollerRef}
        className="grid min-w-0 flex-1 auto-cols-max grid-flow-col grid-rows-2 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sortedBuses.map((bus) => {
          const done = isBusDone(students, bus.id)
          const selected = bus.id === selectedBusId
          const icon = done ? '✓' : '←'
          return (
            <button
              key={bus.id}
              type="button"
              onClick={() => onSelect(bus.id)}
              className={[
                'flex h-10 min-w-[4.75rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-base font-bold',
                selected
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
      <button
        type="button"
        aria-label="גלול שמאלה"
        onClick={() => scrollBy(-160)}
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50"
      >
        ‹
      </button>
    </div>,
    slot,
  )
}
