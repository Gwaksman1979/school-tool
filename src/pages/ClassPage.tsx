import { useCallback, useEffect, useMemo, useState } from 'react'
import ClassCarousel from '../components/ClassCarousel'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { useBusChrome } from '../lib/bus-chrome'
import { usePageTitle } from '../lib/page-title'
import type { Student } from '../types'

export default function ClassPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const { setChrome } = useBusChrome()
  const [selectedClassId, setSelectedClassId] = useState('')

  const handleSelectClass = useCallback((classId: string) => {
    setSelectedClassId((current) => {
      if (classId === current) return current
      navigator.vibrate?.(10)
      return classId
    })
  }, [])

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

  const selectedClass =
    sortedClasses.find((schoolClass) => schoolClass.id === selectedClassId) ?? null

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
      onDropdownSelect: handleSelectClass,
    })
  }, [sortedClasses, selectedClassId, setChrome, handleSelectClass])

  useEffect(() => {
    return () => setChrome(null)
  }, [setChrome])

  const visibleStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students
      .filter((student) => student.class_id === selectedClassId)
      .sort((a, b) => {
        const first = a.first_name.localeCompare(b.first_name, 'he')
        if (first !== 0) return first
        return a.last_name.localeCompare(b.last_name, 'he')
      })
  }, [students, selectedClassId])

  function arrivalBusLabel(student: Student): string | null {
    if (!student.arrival_bus_id) return null
    return busLabelById[student.arrival_bus_id] ?? null
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0">
        <ClassCarousel
          classes={sortedClasses}
          selectedClassId={selectedClassId}
          onSelect={handleSelectClass}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-3">
        {error ? (
          <ConnectionError />
        ) : isLoading ? (
          <Spinner />
        ) : !selectedClassId ? (
          <p className="py-12 text-center text-[#98989d]">
            בחר כיתה כדי לראות תלמידים
          </p>
        ) : visibleStudents.length === 0 ? (
          <p className="py-12 text-center text-[#98989d]">אין תלמידים בכיתה זו</p>
        ) : (
          <ul className="flex min-w-0 list-none flex-col gap-0 p-0">
            {visibleStudents.map((student) => (
              <li key={student.id} className="list-none">
                <StudentCard
                  student={student}
                  busLabel={arrivalBusLabel(student)}
                  className={selectedClass?.name ?? null}
                  onStatusToggle={(current) => toggleStatus(current, null)}
                  variant="directory"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
