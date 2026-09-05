import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useStudents } from '../hooks/useSchoolData'
import { getSchoolId } from '../lib/auth'
import { normalizeStatus } from '../types'
import { PeopleIcon } from './icons'

export default function TopBar() {
  const location = useLocation()
  const schoolId = getSchoolId()
  const { items: students } = useStudents(schoolId)
  const [sheetOpen, setSheetOpen] = useState(false)

  const atSchoolStudents = useMemo(
    () =>
      students
        .filter((student) => normalizeStatus(student.current_status) === 'at_school')
        .sort((a, b) => {
          const first = a.first_name.localeCompare(b.first_name, 'he')
          if (first !== 0) return first
          return a.last_name.localeCompare(b.last_name, 'he')
        }),
    [students],
  )
  const atSchoolCount = atSchoolStudents.length

  useEffect(() => {
    setSheetOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!sheetOpen) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [sheetOpen])

  if (location.pathname === '/settings') return null

  return (
    <>
      <button
        type="button"
        aria-label="תלמידים בבית הספר"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen(true)}
        className="fixed z-[60] flex h-11 items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(28,28,30,0.6)] px-3"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          left: 12,
        }}
      >
        <PeopleIcon className="h-5 w-5 text-[#f4c542]" />
        <span className="text-base font-semibold text-[#f4c542]">{atSchoolCount}</span>
      </button>
      {sheetOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center">
            <button
              type="button"
              aria-label="סגור"
              className="absolute inset-0 border-0 bg-[#000000]/70 p-0"
              onClick={() => setSheetOpen(false)}
            />
            <div
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="at-school-title"
              className="relative z-10 flex w-full max-h-[70vh] flex-col rounded-t-[22px] bg-[#1c1c1e] pb-[env(safe-area-inset-bottom,0px)]"
            >
              <header className="flex shrink-0 items-center gap-3 border-b border-[#3a3a3c] px-4 py-3">
                <h2
                  id="at-school-title"
                  className="min-w-0 flex-1 truncate text-[18px] font-bold text-white"
                >
                  תלמידים בבית הספר
                </h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="סגור"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#98989d]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {atSchoolStudents.length === 0 ? (
                  <p className="px-4 py-12 text-center text-base text-[#98989d]">
                    אין תלמידים בבית הספר
                  </p>
                ) : (
                  <ul className="px-4">
                    {atSchoolStudents.map((student) => (
                      <li
                        key={student.id}
                        className="border-b border-[#3a3a3c] py-3 text-base text-white last:border-b-0"
                      >
                        {student.first_name} {student.last_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
