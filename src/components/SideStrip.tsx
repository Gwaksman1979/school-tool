import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStudents } from '../hooks/useSchoolData'
import { getSchoolId } from '../lib/auth'
import { normalizeStatus } from '../types'

export default function SideStrip() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
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

  return (
    <>
      <nav
        aria-label="ניווט ראשי"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 56,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background:
            'linear-gradient(180deg, rgba(62,142,222,0.12) 0%, rgba(155,89,208,0.12) 55%, rgba(224,68,124,0.12) 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          zIndex: 30,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <a
            href="/"
            aria-label="דף הבית"
            style={{
              color: '#98989d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9.5L12 3l9 6.5" />
              <path d="M19 9.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9.5" />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="הגדרות"
            style={{
              color: path === '/settings' ? '#0071e3' : '#98989d',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0 1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'scaleY(1.35) rotate(180deg)',
              fontFamily: '"Montserrat", -apple-system, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 3,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(180deg, #3E8EDE 0%, #9B59D0 55%, #E0447C 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            new mainstream
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="תלמידים בבית הספר"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(244,197,66,0.15)',
              color: '#f4c542',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {atSchoolCount}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <button
            type="button"
            onClick={() => navigate('/students')}
            aria-label="תלמידים"
            style={{
              color: path === '/students' ? '#0071e3' : '#98989d',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => navigate('/class')}
            aria-label="כיתות"
            style={{
              color: path === '/class' ? '#0071e3' : '#98989d',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path d="M8 20h8" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => navigate('/bus')}
            aria-label="הסעות"
            style={{
              color: path === '/bus' ? '#0071e3' : '#98989d',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="6" width="16" height="10" rx="2" />
              <circle cx="8" cy="18" r="1.5" />
              <circle cx="16" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </nav>
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
