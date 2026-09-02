import { useEffect, useMemo, useState } from 'react'
import PageSheet from '../components/PageSheet'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { usePageTitle } from '../lib/page-title'
import type { Student } from '../types'

export default function ClassPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const [selectedClassId, setSelectedClassId] = useState('')

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

  useEffect(() => {
    setTitle('כיתה')
  }, [setTitle])

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
    <PageSheet>
      <div className="relative mb-3">
        <select
          id="class-select"
          aria-label="בחר כיתה"
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-xl bg-[#0d9488] px-4 py-2 pe-10 text-base font-semibold text-white outline-none"
        >
          {sortedClasses.length === 0 && <option value="">אין כיתות</option>}
          {sortedClasses.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 text-sm text-white"
          aria-hidden="true"
        >
          ▼
        </span>
      </div>

      {error ? (
        <ConnectionError />
      ) : isLoading ? (
        <Spinner />
      ) : !selectedClassId ? (
        <p className="py-12 text-center text-gray-500">
          בחר כיתה כדי לראות תלמידים
        </p>
      ) : visibleStudents.length === 0 ? (
        <p className="py-12 text-center text-gray-500">אין תלמידים בכיתה זו</p>
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
    </PageSheet>
  )
}
