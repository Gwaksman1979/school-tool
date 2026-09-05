import { useEffect, useMemo, useState } from 'react'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { SearchIcon } from '../components/icons'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { usePageTitle } from '../lib/page-title'
import { normalizeStatus, type Student } from '../types'

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

  const atSchoolCount = students.filter(
    (s) => normalizeStatus(s.current_status) === 'at_school',
  ).length

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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', paddingBottom: 4 }}
      >
        <h2 className="text-[17px] font-normal text-[#98989d] m-0">תלמידים</h2>
        <div className="flex items-center gap-2 me-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4c542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span style={{ color: '#f4c542', fontSize: 17, fontWeight: 700 }}>{atSchoolCount}</span>
        </div>
      </div>
      <div className="mt-3 box-border w-full shrink-0 overflow-hidden bg-transparent px-4 py-2">
        <div className="flex h-10 w-full box-border items-center overflow-hidden rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1c1c1e] px-3">
          <span className="shrink-0 text-[#98989d]">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="חיפוש לפי שם..."
            aria-label="חיפוש לפי שם"
            autoComplete="off"
            className="min-w-0 w-full flex-1 border-0 bg-transparent px-3 text-base text-white outline-none placeholder:text-[#7C7C81]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="נקה חיפוש"
              className="shrink-0 border-0 bg-transparent p-0 text-[#98989d]"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-3">
        {error ? (
          <ConnectionError />
        ) : isLoading ? (
          <Spinner />
        ) : visibleStudents.length === 0 ? (
          <p className="py-12 text-center text-[#98989d]">{emptyMessage}</p>
        ) : (
          <ul className="flex min-w-0 list-none flex-col gap-0 p-0">
            {visibleStudents.map((student) => (
              <li key={student.id} className="list-none">
                <StudentCard
                  student={student}
                  busLabel={arrivalBusLabel(student)}
                  className={
                    student.class_id
                      ? (classNameById[student.class_id] ?? null)
                      : null
                  }
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
