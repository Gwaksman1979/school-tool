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

function scrollDiscToCenter(
  scroller: HTMLElement,
  disc: HTMLElement,
  behavior: ScrollBehavior,
) {
  const scrollerRect = scroller.getBoundingClientRect()
  const discRect = disc.getBoundingClientRect()
  const delta =
    discRect.left + discRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2)
  scroller.scrollTo({
    left: scroller.scrollLeft + delta,
    behavior,
  })
}

function nearestDiscId(scroller: HTMLElement): string | null {
  const view = scroller.getBoundingClientRect()
  const viewCenter = view.left + view.width / 2
  let bestId: string | null = null
  let bestDist = Number.POSITIVE_INFINITY
  for (const node of scroller.querySelectorAll<HTMLElement>('[data-bus-id]')) {
    const rect = node.getBoundingClientRect()
    const dist = Math.abs(rect.left + rect.width / 2 - viewCenter)
    const id = node.dataset.busId
    if (id && dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }
  return bestId
}

export default function BusCarousel({
  buses,
  students,
  selectedBusId,
  onSelect,
}: BusCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selectedBusId)
  const programmaticRef = useRef(false)
  const settleTimerRef = useRef<number>(0)
  const didMountScroll = useRef(false)
  const sortedBuses = useMemo(() => sortBuses(buses), [buses])

  selectedRef.current = selectedBusId

  function centerDisc(busId: string, behavior: ScrollBehavior) {
    const scroller = scrollerRef.current
    const disc = scroller?.querySelector<HTMLElement>(`[data-bus-id="${busId}"]`)
    if (!scroller || !disc) return
    programmaticRef.current = true
    scrollDiscToCenter(scroller, disc, behavior)
  }

  useEffect(() => {
    if (!selectedBusId) return
    const behavior = didMountScroll.current ? 'smooth' : 'auto'
    didMountScroll.current = true
    centerDisc(selectedBusId, behavior)
  }, [selectedBusId])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const element = scroller

    function settleFromScroll() {
      if (programmaticRef.current) {
        programmaticRef.current = false
        return
      }
      const id = nearestDiscId(element)
      if (id && id !== selectedRef.current) {
        onSelect(id)
      }
    }

    function handleScroll() {
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = window.setTimeout(settleFromScroll, 150)
    }

    function handleScrollEnd() {
      window.clearTimeout(settleTimerRef.current)
      settleFromScroll()
    }

    scroller.addEventListener('scroll', handleScroll, { passive: true })
    scroller.addEventListener('scrollend', handleScrollEnd)
    return () => {
      scroller.removeEventListener('scroll', handleScroll)
      scroller.removeEventListener('scrollend', handleScrollEnd)
      window.clearTimeout(settleTimerRef.current)
    }
  }, [onSelect])

  function handleTap(busId: string) {
    if (busId === selectedRef.current) {
      centerDisc(busId, 'smooth')
      return
    }
    onSelect(busId)
  }

  return (
    <div
      ref={scrollerRef}
      dir="rtl"
      className="bus-carousel flex items-center gap-3 py-3"
      style={{ paddingInline: 'calc(50% - 46px)' }}
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
            onClick={() => handleTap(bus.id)}
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
