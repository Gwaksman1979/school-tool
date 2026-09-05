import type { SchoolClass } from '../types'

const CLASS_COLORS = ['#3a7bd5', '#b6a324', '#d97a1f', '#E06818']

interface ClassCarouselProps {
  classes: SchoolClass[]
  selectedClassId: string
  onSelect: (classId: string) => void
}

function classColor(index: number): string {
  return CLASS_COLORS[index % CLASS_COLORS.length] ?? '#3a7bd5'
}

export default function ClassCarousel({
  classes,
  selectedClassId,
  onSelect,
}: ClassCarouselProps) {
  return (
    <div
      dir="rtl"
      className="flex gap-2 overflow-x-auto px-5 pb-3.5"
      style={{ scrollbarWidth: 'none' }}
    >
      {classes.map((schoolClass, index) => {
        const selected = schoolClass.id === selectedClassId
        return (
          <button
            key={schoolClass.id}
            type="button"
            data-class-id={schoolClass.id}
            onClick={() => onSelect(schoolClass.id)}
            aria-label={schoolClass.name}
            aria-pressed={selected}
            className="flex-none px-5 py-2.5 rounded-full text-sm font-semibold text-white whitespace-nowrap"
            style={{
              backgroundColor: classColor(index),
              border: selected ? '2px solid #fff' : '2px solid transparent',
            }}
          >
            {schoolClass.name}
          </button>
        )
      })}
    </div>
  )
}
