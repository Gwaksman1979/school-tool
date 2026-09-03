import { useEffect, useMemo, useRef, useState } from 'react'
import PageSheet from '../components/PageSheet'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { useBusChrome } from '../lib/bus-chrome'
import { usePageTitle } from '../lib/page-title'
import type { Student } from '../types'

const CLASS_COLORS = [
  '#3D90F0',
  '#278A3E',
  '#E06818',
  '#7B61FF',
  '#E04B8A',
  '#1B8A6B',
  '#C9A227',
  '#5B7CFA',
  '#D35400',
  '#8E44AD',
]

function classColor(index: number): string {
  return CLASS_COLORS[index % CLASS_COLORS.length] ?? '#3D90F0'
}

export default function ClassPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const { setChrome } = useBusChrome()
  const [selectedClassId, setSelectedClassId] = useState('')
  const scrollerRef = useRef<HTMLDivElement>(null)

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((a, b) =>
        a.name.localeCompare(b.name, 'he', { numeric: true }),
      ),
    [classes],
  )

  useEffect(() => {
    if (!selectedClassId && sortedClasses[0]) {
      setSelectedClassId(sortedClasses[0].id)
    }
  }, [selectedClassId, sortedClasses])

  const busLabelById = useMemo(
    () => Object.fromEntries(buses.map((bus) => [bus.id, bus.label])),
    [buses],
  )

  const selectedClass = sortedClasses.find((schoolClass) => schoolClass.id === selectedClassId) ?? null
  const selectedIndex = sortedClasses.findIndex((schoolClass) => schoolClass.id === selectedClassId)

  useEffect(() => {
    setTitle(selectedClass ? selectedClass.name : 'כיתה')
  }, [selectedClass, setTitle])

  useEffect(() => {
    setChrome({
      dropdownItems: sortedClasses.map((schoolClass) => ({
        id: schoolClass.id,
        label: schoolClass.name,
      })),
      selectedId: selectedClassId,
      onDropdownSelect: setSelectedClassId,
    })
  }, [sortedClasses, selectedClassId, setChrome])

  useEffect(() => {
    return () => setChrome(null)
  }, [setChrome])

  useEffect(() => {
    const selected = scrollerRef.current?.querySelector(
      `[data-class-id="${selectedClassId}"]`,
    )
    selected?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedClassId])

  const countByClassId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const student of students) {
      counts.set(student.class_id, (counts.get(student.class_id) ?? 0) + 1)
    }
    return counts
  }, [students])

  const visibleStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students
      .filter((student) => student.class_id === selectedClassId)
      .sort((a, b) => a.first_name.localeCompare(b.first_name, 'he'))
  }, [students, selectedClassId])

  function arrivalBusLabel(student: Student): string | null {
    if (!student.arrival_bus_id) return null
    return busLabelById[student.arrival_bus_id] ?? null
  }

  return (
    <>
      <div
        ref={scrollerRef}
        dir="rtl"
        className="class-carousel flex items-stretch gap-3 px-[10%] py-3"
      >
        {sortedClasses.map((schoolClass, index) => {
          const selected = schoolClass.id === selectedClassId
          return (
            <button
              key={schoolClass.id}
              type="button"
              data-class-id={schoolClass.id}
              onClick={() => setSelectedClassId(schoolClass.id)}
              aria-pressed={selected}
              className="flex h-[118px] w-[42%] min-w-[9.5rem] shrink-0 snap-center flex-col items-center justify-center rounded-[18px] px-3 text-white"
              style={{
                backgroundColor: classColor(index),
                border: selected ? '2px solid #FFFFFF' : '2px solid transparent',
                transform: selected ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 180ms ease, border-color 180ms ease',
              }}
            >
              <p className="text-base font-bold">{schoolClass.name}</p>
              <p className="mt-1 text-4xl font-bold leading-none">
                {countByClassId.get(schoolClass.id) ?? 0}
              </p>
              <p className="mt-1 text-sm font-medium opacity-90">תלמידים</p>
            </button>
          )
        })}
      </div>
      {sortedClasses.length > 0 && (
        <div className="mb-2 flex items-center justify-center gap-1.5">
          {sortedClasses.map((schoolClass, index) => (
            <span
              key={schoolClass.id}
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: index === selectedIndex ? '#3D90F0' : '#2A3448',
              }}
            />
          ))}
        </div>
      )}
      <PageSheet>
        {error ? (
          <ConnectionError />
        ) : isLoading ? (
          <Spinner />
        ) : !selectedClassId ? (
          <p className="py-12 text-center text-[#8494AD]">
            בחר כיתה כדי לראות תלמידים
          </p>
        ) : (
          <>
            <h2 className="mb-3 text-center text-[17px] font-medium text-white">
              סה״כ {visibleStudents.length} תלמידים
            </h2>
            {visibleStudents.length === 0 ? (
              <p className="py-12 text-center text-[#8494AD]">אין תלמידים בכיתה זו</p>
            ) : (
              <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
                {visibleStudents.map((student) => (
                  <li key={student.id} className="list-none">
                    <StudentCard
                      student={student}
                      busLabel={arrivalBusLabel(student)}
                      className={selectedClass?.name ?? null}
                      onStatusToggle={(current) => toggleStatus(current, null)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PageSheet>
    </>
  )
}
