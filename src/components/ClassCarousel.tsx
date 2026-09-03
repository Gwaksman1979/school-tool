import { useEffect, useRef } from 'react'
import type { SchoolClass } from '../types'

const CLASS_COLORS = [
  '#E06818',
  '#D48A18',
  '#C4A820',
  '#3D90F0',
  '#3580E0',
  '#278A3E',
  '#30A84E',
  '#7B61FF',
  '#9B59B6',
  '#E04B8A',
]

const TILE_WIDTH = 90
const TILE_HEIGHT = 64

interface ClassCarouselProps {
  classes: SchoolClass[]
  selectedClassId: string
  onSelect: (classId: string) => void
}

function classColor(index: number): string {
  return CLASS_COLORS[index % CLASS_COLORS.length] ?? '#3D90F0'
}

function scrollTileToCenter(
  scroller: HTMLElement,
  tile: HTMLElement,
  behavior: ScrollBehavior,
) {
  const scrollerRect = scroller.getBoundingClientRect()
  const tileRect = tile.getBoundingClientRect()
  const delta =
    tileRect.left + tileRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2)
  scroller.scrollTo({
    left: scroller.scrollLeft + delta,
    behavior,
  })
}

function nearestTileId(scroller: HTMLElement): string | null {
  const view = scroller.getBoundingClientRect()
  const viewCenter = view.left + view.width / 2
  let bestId: string | null = null
  let bestDist = Number.POSITIVE_INFINITY
  for (const node of scroller.querySelectorAll<HTMLElement>('[data-class-id]')) {
    const rect = node.getBoundingClientRect()
    const dist = Math.abs(rect.left + rect.width / 2 - viewCenter)
    const id = node.dataset.classId
    if (id && dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }
  return bestId
}

export default function ClassCarousel({
  classes,
  selectedClassId,
  onSelect,
}: ClassCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selectedClassId)
  const programmaticRef = useRef(false)
  const settleTimerRef = useRef<number>(0)
  const didMountScroll = useRef(false)

  selectedRef.current = selectedClassId

  function centerTile(classId: string, behavior: ScrollBehavior) {
    const scroller = scrollerRef.current
    const tile = scroller?.querySelector<HTMLElement>(`[data-class-id="${classId}"]`)
    if (!scroller || !tile) return
    programmaticRef.current = true
    scrollTileToCenter(scroller, tile, behavior)
  }

  useEffect(() => {
    if (!selectedClassId) return
    const behavior = didMountScroll.current ? 'smooth' : 'auto'
    didMountScroll.current = true
    centerTile(selectedClassId, behavior)
  }, [selectedClassId])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const element = scroller

    function settleFromScroll() {
      if (programmaticRef.current) {
        programmaticRef.current = false
        return
      }
      const id = nearestTileId(element)
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

  function handleTap(classId: string) {
    if (classId === selectedRef.current) {
      centerTile(classId, 'smooth')
      return
    }
    onSelect(classId)
  }

  return (
    <div
      ref={scrollerRef}
      dir="rtl"
      className="class-carousel mb-3 flex items-center gap-3 py-1"
      style={{ paddingInline: `calc(50% - ${TILE_WIDTH / 2}px)` }}
    >
      {classes.map((schoolClass, index) => {
        const selected = schoolClass.id === selectedClassId
        const fill = classColor(index)
        return (
          <button
            key={schoolClass.id}
            type="button"
            data-class-id={schoolClass.id}
            onClick={() => handleTap(schoolClass.id)}
            aria-label={schoolClass.name}
            aria-pressed={selected}
            className="flex shrink-0 snap-center flex-col items-center justify-center rounded-[14px] text-white"
            style={{
              width: TILE_WIDTH,
              height: TILE_HEIGHT,
              backgroundColor: fill,
              border: selected ? '2px solid #FFFFFF' : '2px solid transparent',
              transform: selected ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 180ms ease, border-color 180ms ease',
            }}
          >
            <span className="px-1 text-center text-[17px] font-bold leading-tight">
              {schoolClass.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
