import { useEffect, useMemo, useRef, useState } from 'react'
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
  const schoolId = getSchoolId()
  const { items: students } = useStudents(schoolId)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const showDropdown = Boolean(dropdownItems && dropdownItems.length > 0 && onDropdownSelect)

  const atSchoolCount = useMemo(
    () =>
      students.filter((student) => normalizeStatus(student.current_status) === 'at_school')
        .length,
    [students],
  )

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, selectedId])

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
    <header
      dir="ltr"
      className="app-top-bar relative flex items-end justify-center bg-transparent px-4 pb-2.5 text-white"
    >
      {isSettings ? (
        <button
          type="button"
          aria-label="חזרה"
          onClick={goBack}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#1A2030] text-white"
        >
          <BackIcon className="h-6 w-6" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="הגדרות"
          onClick={() => navigate('/settings')}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#1A2030] p-0 text-white"
        >
          <GearIcon className="h-6 w-6" />
        </button>
      )}

      <div
        ref={menuRef}
        className="absolute left-1/2 max-w-[60%] -translate-x-1/2 bg-transparent"
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
            <span className="truncate text-2xl font-bold text-white">{title}</span>
            <ChevronDownIcon
              className="h-4 w-4 shrink-0 bg-transparent text-[#8494AD] transition-transform duration-200"
              style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        ) : (
          <h1 dir="rtl" className="truncate bg-transparent text-center text-2xl font-bold text-white">
            {title}
          </h1>
        )}
        {showDropdown && open && dropdownItems && onDropdownSelect && (
          <ul
            dir="rtl"
            role="listbox"
            className="absolute top-full right-1/2 z-50 mt-2 max-h-64 w-52 translate-x-1/2 overflow-y-auto rounded-[18px] border border-[#222A3A] bg-[#1A2030] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
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
                    item.muted ? 'text-[#8494AD]' : '',
                  ].join(' ')}
                >
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isSettings && (
        <div className="absolute right-2 flex h-11 items-center gap-1.5 rounded-full bg-[#1A2030] px-3">
          <PeopleIcon className="h-5 w-5 text-[#F0A030]" />
          <span className="text-base font-semibold text-white">{atSchoolCount}</span>
        </div>
      )}
    </header>
  )
}
