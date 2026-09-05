import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStudents } from '../hooks/useSchoolData'
import { getSchoolId } from '../lib/auth'
import { usePageTitle } from '../lib/page-title'
import { normalizeStatus } from '../types'
import { BackIcon, ChevronDownIcon, GearIcon, PeopleIcon } from './icons'

export interface TopBarDropdownItem {
  id: string
  label: string
  muted?: boolean
}

interface TopBarProps {
  onDropdown?: () => void
  dropdownItems?: TopBarDropdownItem[]
  onDropdownSelect?: (id: string) => void
  selectedId?: string
}

export default function TopBar({
  onDropdown,
  dropdownItems,
  onDropdownSelect,
  selectedId,
}: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { title } = usePageTitle()
  const isSettings = location.pathname === '/settings'
  const isBusOrClass = location.pathname === '/bus' || location.pathname === '/class'
  const schoolId = getSchoolId()
  const { items: students } = useStudents(schoolId)
  const [open, setOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const showDropdown = Boolean(dropdownItems && dropdownItems.length > 0 && onDropdownSelect)

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
    setOpen(false)
    setSheetOpen(false)
  }, [location.pathname, selectedId])

  useEffect(() => {
    if (!sheetOpen) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [sheetOpen])

  useEffect(() => {
    if (!open) return
    function handlePointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [open])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/bus')
  }

  function toggleDropdown() {
    setOpen((value) => !value)
    onDropdown?.()
  }

  return (
    <>
    <header
      dir="ltr"
      className="app-top-bar relative z-[60] flex items-end justify-center overflow-visible bg-transparent px-4 pt-[calc(env(safe-area-inset-top,0px)+0.25rem)] pb-2 text-white"
    >
      {!isBusOrClass && showDropdown && open && (
        <button
          type="button"
          aria-label="סגור"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[59] border-0 bg-transparent p-0"
        />
      )}
      {isSettings ? (
        <button
          type="button"
          aria-label="חזרה"
          onClick={goBack}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-[#98989d]"
        >
          <BackIcon className="h-6 w-6" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="הגדרות"
          onClick={() => navigate('/settings')}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#98989d]"
        >
          <GearIcon className="h-6 w-6" />
        </button>
      )}

      {!isBusOrClass && (
      <div
        ref={menuRef}
        className="absolute left-1/2 z-[60] max-w-[60%] -translate-x-1/2 bg-transparent"
      >
        {showDropdown ? (
          <button
            type="button"
            dir="rtl"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="בחירה"
            onClick={toggleDropdown}
            className="flex appearance-none items-center justify-center gap-1.5 border-0 bg-transparent p-0 shadow-none outline-none"
          >
            <span
              className="truncate text-xl font-bold text-white"
              style={{ fontFamily: '"Montserrat", -apple-system, sans-serif' }}
            >
              {title}
            </span>
            <ChevronDownIcon
              className="h-4 w-4 shrink-0 bg-transparent text-[#98989d] transition-transform duration-200"
              style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        ) : (
          <h1
            dir="rtl"
            className="truncate bg-transparent text-center text-xl font-bold text-white"
            style={{ fontFamily: '"Montserrat", -apple-system, sans-serif' }}
          >
            {title}
          </h1>
        )}
        {showDropdown && open && dropdownItems && onDropdownSelect && (
          <ul
            dir="rtl"
            role="listbox"
            className="absolute top-full right-1/2 z-[60] mt-2 max-h-64 w-52 translate-x-1/2 overflow-y-auto rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[#1c1c1e] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
          >
            {dropdownItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === selectedId}
                  onClick={() => {
                    onDropdownSelect(item.id)
                    setOpen(false)
                  }}
                  className={[
                    'flex min-h-11 w-full items-center justify-between px-3 text-right text-base',
                    item.id === selectedId ? 'font-semibold text-[#3D90F0]' : 'text-white',
                    item.muted ? 'text-[#98989d]' : '',
                  ].join(' ')}
                >
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      {!isSettings && (
        <button
          type="button"
          aria-label="תלמידים בבית הספר"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => {
            setOpen(false)
            setSheetOpen(true)
          }}
          className="absolute right-2 flex h-11 items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(28,28,30,0.6)] px-3"
        >
          <PeopleIcon className="h-5 w-5 text-[#f4c542]" />
          <span className="text-base font-semibold text-[#f4c542]">{atSchoolCount}</span>
        </button>
      )}
    </header>
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
