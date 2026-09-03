import { useEffect, useMemo, useState } from 'react'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { SearchIcon } from '../components/icons'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { usePageTitle } from '../lib/page-title'
import type { Student } from '../types'

function ClearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function matchesSearch(student: Student, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase('he')
  if (!normalized) return true
  const first = student.first_name.toLocaleLowerCase('he')
  const last = student.last_name.toLocaleLowerCase('he')
  return (
    first.includes(normalized) ||
    last.includes(normalized) ||
    `${first} ${last}`.includes(normalized)
  )
}

export default function StudentsPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const [search, setSearch] = useState('')

  useEffect(() => {
    setTitle('תלמידים')
  }, [setTitle])

  const classNameById = useMemo(
    () => Object.fromEntries(classes.map((schoolClass) => [schoolClass.id, schoolClass.name])),
    [classes],
  )

  const busLabelById = useMemo(
    () => Object.fromEntries(buses.map((bus) => [bus.id, bus.label])),
    [buses],
  )

  const visibleStudents = useMemo(() => {
    return students
      .filter((student) => matchesSearch(student, search))
      .sort((a, b) => {
        const first = a.first_name.localeCompare(b.first_name, 'he')
        if (first !== 0) return first
        return a.last_name.localeCompare(b.last_name, 'he')
      })
  }, [students, search])

  function arrivalBusLabel(student: Student): string | null {
    if (!student.arrival_bus_id) return null
    return busLabelById[student.arrival_bus_id] ?? null
  }

  let emptyMessage = 'לא נמצאו תלמידים'
  if (!search.trim() && students.length === 0) {
    emptyMessage = 'אין תלמידים רשומים. הוסף תלמידים בהגדרות.'
  }

  return (
    <div className="px-4 py-3">
      <div className="relative mb-3">
        <span className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#8494AD]">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="חיפוש לפי שם..."
          aria-label="חיפוש לפי שם"
          autoComplete="off"
          className="min-h-12 w-full rounded-[18px] border-0 bg-[#151A28] py-2 ps-10 pe-12 text-base text-white outline-none placeholder:text-[#7C7C81]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="נקה חיפוש"
            className="absolute top-1/2 end-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[#8494AD]"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {error ? (
        <ConnectionError />
      ) : isLoading ? (
        <Spinner />
      ) : visibleStudents.length === 0 ? (
        <p className="py-12 text-center text-[#8494AD]">{emptyMessage}</p>
      ) : (
        <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
          {visibleStudents.map((student) => (
            <li key={student.id} className="list-none">
              <StudentCard
                student={student}
                busLabel={arrivalBusLabel(student)}
                className={classNameById[student.class_id] ?? null}
                onStatusToggle={(current) => toggleStatus(current, null)}
                variant="directory"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
