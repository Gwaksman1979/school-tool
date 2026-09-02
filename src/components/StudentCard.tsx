import { doc, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import {
  addRemark,
  deleteRemark,
  todayDateString,
  useRemarks,
} from '../hooks/useRemarks'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import { normalizeStatus, type Student } from '../types'
import Modal from './Modal'
import Spinner from './Spinner'

interface StudentCardProps {
  student: Student
  busLabel: string | null
  className: string | null
  onStatusToggle: (student: Student) => void | Promise<void>
  onRemarkClick?: (student: Student) => void
}

function buildMetaLine(
  className: string | null,
  busLabel: string | null,
  transportMode: Student['transport_mode'],
): string {
  const parts: string[] = []
  if (className) parts.push(className)
  if (transportMode === 'independent') parts.push('עצמאי')
  else if (transportMode === 'family') parts.push('משפחה')
  else if (busLabel) parts.push(`אוטובוס ${busLabel}`)
  return parts.join(' · ')
}

function formatRemarkDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

/* Two states only: at_school = in, everything else = out */
function isIn(status: Student['current_status'] | string): boolean {
  return normalizeStatus(status) === 'at_school'
}

function statusBadge(status: Student['current_status'] | string) {
  if (isIn(status)) {
    return {
      label: 'יציאה',
      className: 'bg-[#0d9488] text-white',
    }
  }
  return {
    label: 'כניסה',
    className: 'bg-[#f97316] text-white',
  }
}

async function setTransportMode(
  student: Student,
  mode: Student['transport_mode'],
) {
  await updateDoc(doc(db, 'schools', student.school_id, 'students', student.id), {
    transport_mode: mode,
    arrival_bus_id: null,
    departure_bus_id: null,
  })
}

export default function StudentCard({
  student,
  busLabel,
  className,
  onStatusToggle,
  onRemarkClick,
}: StudentCardProps) {
  const fullName = `${student.first_name} ${student.last_name}`
  const meta = buildMetaLine(className, busLabel, student.transport_mode)
  const isNotBus = student.transport_mode !== 'bus'
  const badge = statusBadge(student.current_status)
  const studentIsIn = isIn(student.current_status)

  const [expanded, setExpanded] = useState(false)
  const [pickingMode, setPickingMode] = useState(false)
  const [remarksOpen, setRemarksOpen] = useState(false)
  const [remarkDate, setRemarkDate] = useState(todayDateString)
  const [remarkText, setRemarkText] = useState('')
  const [isSavingRemark, setIsSavingRemark] = useState(false)
  const [writeError, setWriteError] = useState<string | null>(null)

  const remarks = useRemarks(student.school_id, student.id)
  const today = todayDateString()
  const todayRemarkCount = remarks.filter((remark) => remark.date === today).length
  const showModeSelector = isNotBus || pickingMode

  async function handleTransportCheck(checked: boolean) {
    if (checked) {
      setPickingMode(true)
      return
    }
    setPickingMode(false)
    if (student.transport_mode !== 'bus') {
      try {
        await setTransportMode(student, 'bus')
        setWriteError(null)
      } catch (error) {
        console.error('Failed to revert transport mode', error)
        setWriteError(WRITE_ERROR)
      }
    }
  }

  async function handleSelectMode(mode: 'independent' | 'family') {
    try {
      await setTransportMode(student, mode)
      setPickingMode(false)
      setWriteError(null)
    } catch (error) {
      console.error('Failed to update transport mode', error)
      setWriteError(WRITE_ERROR)
    }
  }

  function openRemarks() {
    setRemarkDate(todayDateString())
    setRemarkText('')
    setRemarksOpen(true)
    onRemarkClick?.(student)
  }

  async function handleSaveRemark() {
    if (!remarkText.trim() || isSavingRemark) return
    setIsSavingRemark(true)
    try {
      await addRemark(student.school_id, student.id, remarkDate, remarkText)
      setRemarkText('')
      setWriteError(null)
    } catch (error) {
      console.error('Failed to save remark', error)
      setWriteError(WRITE_ERROR)
    } finally {
      setIsSavingRemark(false)
    }
  }

  async function handleDeleteRemark(remarkId: string) {
    try {
      await deleteRemark(student.school_id, student.id, remarkId)
      setWriteError(null)
    } catch (error) {
      console.error('Failed to delete remark', error)
      setWriteError(WRITE_ERROR)
    }
  }

  return (
    <article
      className="min-w-0 w-full rounded-2xl px-3 py-1.5"
      style={{ backgroundColor: studentIsIn ? '#d1fae5' : '#f3f4f6' }}
    >
      <div className="flex min-h-11 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void (async () => {
              try {
                await onStatusToggle(student)
                setWriteError(null)
              } catch (error) {
                console.error(error)
                setWriteError(WRITE_ERROR)
              }
            })()
          }}
          aria-label={`עדכון סטטוס של ${fullName}`}
          className={`flex min-h-9 min-w-[4.75rem] shrink-0 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors duration-300 ${badge.className}`}
        >
          {badge.label}
        </button>

        <p className="min-w-0 flex-1 truncate text-center text-base font-bold text-gray-900">
          {fullName}
        </p>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-label={`פרטים נוספים עבור ${fullName}`}
          className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          {meta && <p className="mb-2 text-sm text-gray-500">{meta}</p>}
          <label className="flex min-h-11 items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={isNotBus || pickingMode}
              onChange={(event) => {
                void handleTransportCheck(event.target.checked)
              }}
              className="h-4 w-4 accent-teal-600"
            />
            לא נוסע באוטובוס
          </label>
          {showModeSelector && (
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                onClick={() => void handleSelectMode('independent')}
                className={[
                  'min-h-11 rounded-full px-3 text-xs font-medium',
                  student.transport_mode === 'independent'
                    ? 'bg-[#0d9488] text-white'
                    : 'bg-gray-100 text-gray-700',
                ].join(' ')}
              >
                עצמאי
              </button>
              <button
                type="button"
                onClick={() => void handleSelectMode('family')}
                className={[
                  'min-h-11 rounded-full px-3 text-xs font-medium',
                  student.transport_mode === 'family'
                    ? 'bg-[#0d9488] text-white'
                    : 'bg-gray-100 text-gray-700',
                ].join(' ')}
              >
                משפחה
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={openRemarks}
            className="relative mt-2 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-teal-700 hover:bg-teal-50"
          >
            הערות
            {todayRemarkCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0d9488] px-1 text-[10px] font-medium text-white">
                {todayRemarkCount}
              </span>
            )}
          </button>
          {writeError && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {writeError}
            </p>
          )}
        </div>
      )}

      <Modal
        open={remarksOpen}
        title={`הערות — ${fullName}`}
        onClose={() => setRemarksOpen(false)}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveRemark()
          }}
        >
          <label className="block text-sm font-medium text-gray-700">
            תאריך
            <input
              type="date"
              value={remarkDate}
              onChange={(event) => setRemarkDate(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <textarea
            value={remarkText}
            onChange={(event) => setRemarkText(event.target.value)}
            placeholder="הוסף הערה..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="submit"
            disabled={isSavingRemark || !remarkText.trim()}
            className="flex min-h-11 items-center justify-center rounded-lg bg-[#0d9488] px-4 py-2 text-base font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingRemark ? <Spinner compact onDark /> : 'שמור'}
          </button>
          {writeError && (
            <p className="text-center text-sm text-red-600" role="alert">
              {writeError}
            </p>
          )}
        </form>

        <div className="mt-5 border-t border-gray-100 pt-3">
          {remarks.length === 0 ? (
            <p className="text-center text-sm text-gray-400">אין הערות</p>
          ) : (
            <ul className="flex flex-col">
              {remarks.map((remark) => (
                <li
                  key={remark.id}
                  className="flex items-start gap-2 border-b border-gray-100 py-2 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">
                      {formatRemarkDate(remark.date)}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {remark.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteRemark(remark.id)}
                    aria-label="מחק הערה"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
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
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </article>
  )
}
