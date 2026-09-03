import { doc, updateDoc } from 'firebase/firestore'
import { useState, type ReactNode } from 'react'
import {
  addRemark,
  deleteRemark,
  todayDateString,
  useRemarks,
} from '../hooks/useRemarks'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import { normalizeStatus, type Student } from '../types'
import {
  BusIcon,
  CheckIcon,
  ChevronDownIcon,
  ClassRoomIcon,
  ExitLeftIcon,
  ExitRightIcon,
  NoteIcon,
  ChevronLeftIcon,
  PersonFilledIcon,
} from './icons'
import Modal from './Modal'
import Spinner from './Spinner'

interface StudentCardProps {
  student: Student
  busLabel: string | null
  className: string | null
  onStatusToggle: (student: Student) => void | Promise<void>
  onRemarkClick?: (student: Student) => void
  variant?: 'row' | 'directory'
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
      className: 'bg-[#278A3E] text-white',
    }
  }
  return {
    label: 'כניסה',
    className: 'bg-[#E06818] text-white',
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

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-[#222A3A] py-2 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-[#5BA0FF]">{icon}</span>
        <span className="text-sm text-[#C0C0C6]">{label}</span>
      </div>
      <div className="min-w-0 text-sm font-medium text-white">{children}</div>
    </div>
  )
}

export default function StudentCard({
  student,
  busLabel,
  className,
  onStatusToggle,
  onRemarkClick,
  variant = 'row',
}: StudentCardProps) {
  const fullName = `${student.first_name} ${student.last_name}`
  const classLabel = className
    ? className.startsWith('כיתה')
      ? className
      : `כיתה ${className}`
    : null
  const isNotBus = student.transport_mode !== 'bus'
  const badge = statusBadge(student.current_status)
  const studentIsIn = isIn(student.current_status)
  const independentArrival = isNotBus || !student.arrival_bus_id
  const independentDeparture = isNotBus || !student.departure_bus_id

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

  const statusButton = (
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
      className={`flex min-h-9 min-w-[5.25rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors duration-300 ${badge.className}`}
    >
      {variant === 'directory' &&
        (studentIsIn ? (
          <ExitLeftIcon className="h-4 w-4" />
        ) : (
          <ExitRightIcon className="h-4 w-4" />
        ))}
      {badge.label}
    </button>
  )

  const expandButton =
    variant === 'directory' ? (
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={`פרטים נוספים עבור ${fullName}`}
        className="shrink-0 border-0 bg-transparent p-0 text-[#8E8E93]"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={`פרטים נוספים עבור ${fullName}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#222A3A]"
      >
        <ChevronDownIcon
          className="h-4 w-4 text-[#9A9A9F] transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        />
      </button>
    )

  return (
    <article
      className={
        variant === 'directory'
          ? 'mb-1.5 box-border rounded-[15px] bg-[#151A28] px-3 py-2'
          : 'rounded-[15px] bg-[#1A2030] px-3 py-2'
      }
    >
      {variant === 'directory' ? (
        <div className="flex h-[46px] items-center gap-2.5">
          <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#1A2030] text-[#3D90F0]">
            <PersonFilledIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1 text-right leading-tight">
            <p className="truncate text-[17px] font-bold text-white">{fullName}</p>
            {classLabel && (
              <p className="truncate text-[14px] text-[#C0C0C6]">{classLabel}</p>
            )}
          </div>
          {expandButton}
          {statusButton}
        </div>
      ) : (
        <div className="flex min-h-11 items-center gap-2">
          {statusButton}
          <p className="min-w-0 flex-1 truncate text-right text-[17px] font-medium text-white">
            {fullName}
          </p>
          {expandButton}
        </div>
      )}

      {expanded && (
        <div className="mt-2">
          <DetailRow icon={<ClassRoomIcon className="h-4 w-4" />} label="כיתה">
            {className || '—'}
          </DetailRow>
          <DetailRow icon={<BusIcon className="h-4 w-4" />} label="מספר אוטובוס">
            {busLabel || '—'}
          </DetailRow>
          <DetailRow icon={<ExitRightIcon className="h-4 w-4" />} label="הגעה עצמאית">
            {independentArrival ? (
              <CheckIcon className="h-5 w-5 text-[#278A3E]" />
            ) : (
              <span className="text-[#4E5D75]">—</span>
            )}
          </DetailRow>
          <DetailRow icon={<ExitLeftIcon className="h-4 w-4" />} label="יציאה עצמאית">
            {independentDeparture ? (
              <CheckIcon className="h-5 w-5 text-[#278A3E]" />
            ) : (
              <span className="text-[#4E5D75]">—</span>
            )}
          </DetailRow>
          <button
            type="button"
            onClick={openRemarks}
            className="flex min-h-11 w-full items-center justify-between border-b border-[#222A3A] py-2"
          >
            <span className="flex items-center gap-2">
              <NoteIcon className="h-4 w-4 text-[#5BA0FF]" />
              <span className="text-sm text-[#C0C0C6]">הערות</span>
            </span>
            {todayRemarkCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3D90F0] px-1 text-[10px] font-medium text-white">
                {todayRemarkCount}
              </span>
            )}
          </button>
          <label className="mt-2 flex min-h-11 items-center gap-1.5 text-xs text-[#C0C0C6]">
            <input
              type="checkbox"
              checked={isNotBus || pickingMode}
              onChange={(event) => {
                void handleTransportCheck(event.target.checked)
              }}
              className="h-4 w-4 accent-[#3D90F0]"
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
                    ? 'bg-[#3D90F0] text-white'
                    : 'bg-[#222A3A] text-[#C0C0C6]',
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
                    ? 'bg-[#3D90F0] text-white'
                    : 'bg-[#222A3A] text-[#C0C0C6]',
                ].join(' ')}
              >
                משפחה
              </button>
            </div>
          )}
          {writeError && (
            <p className="mt-1 text-xs text-red-400" role="alert">
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
          <label className="block text-sm font-medium text-[#C0C0C6]">
            תאריך
            <input
              type="date"
              value={remarkDate}
              onChange={(event) => setRemarkDate(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#222A3A] bg-[#151A28] px-3 py-2 text-base text-white outline-none focus:border-[#3D90F0] focus:ring-2 focus:ring-[#3D90F0]/30"
            />
          </label>
          <textarea
            value={remarkText}
            onChange={(event) => setRemarkText(event.target.value)}
            placeholder="הוסף הערה..."
            rows={3}
            className="w-full rounded-lg border border-[#222A3A] bg-[#151A28] px-3 py-2 text-base text-white outline-none focus:border-[#3D90F0] focus:ring-2 focus:ring-[#3D90F0]/30"
          />
          <button
            type="submit"
            disabled={isSavingRemark || !remarkText.trim()}
            className="flex min-h-11 items-center justify-center rounded-full bg-[#3D90F0] px-4 py-2 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingRemark ? <Spinner compact onDark /> : 'שמור'}
          </button>
          {writeError && (
            <p className="text-center text-sm text-red-400" role="alert">
              {writeError}
            </p>
          )}
        </form>

        <div className="mt-5 border-t border-[#222A3A] pt-3">
          {remarks.length === 0 ? (
            <p className="text-center text-sm text-[#8494AD]">אין הערות</p>
          ) : (
            <ul className="flex flex-col">
              {remarks.map((remark) => (
                <li
                  key={remark.id}
                  className="flex items-start gap-2 border-b border-[#222A3A] py-2 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8494AD]">
                      {formatRemarkDate(remark.date)}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-white">
                      {remark.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteRemark(remark.id)}
                    aria-label="מחק הערה"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8494AD] hover:text-red-400"
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
