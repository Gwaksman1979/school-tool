import type { SchoolClass } from '../types'

interface ClassCarouselProps {
  classes: SchoolClass[]
  selectedClassId: string
  onSelect: (classId: string) => void
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
      {classes.map((schoolClass) => {
        const selected = schoolClass.id === selectedClassId
        return (
          <button
            key={schoolClass.id}
            type="button"
            data-class-id={schoolClass.id}
            onClick={() => onSelect(schoolClass.id)}
            aria-label={schoolClass.name}
            aria-pressed={selected}
            className="flex-none px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap"
            style={{
              background: selected
                ? 'linear-gradient(135deg, #f5a742, #F0A030)'
                : '#2c2c2e',
              color: selected ? '#000000' : '#ffffff',
              border: selected ? '2px solid #fff' : '2px solid transparent',
              transform: selected ? 'scale(1.05)' : 'none',
              boxShadow: selected ? '0 0 14px rgba(245,167,66,0.35)' : undefined,
              opacity: 1,
              transition: 'all 180ms ease',
            }}
          >
            {schoolClass.name}
          </button>
        )
      })}
    </div>
  )
}
