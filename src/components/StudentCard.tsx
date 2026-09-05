import { useMemo, useState } from 'react'
import {
  addRemark,
  deleteRemark,
  todayDateString,
  useRemarks,
} from '../hooks/useRemarks'
import { WRITE_ERROR } from '../lib/messages'
import { normalizeStatus, type Student } from '../types'
import { ChevronDownIcon, PersonFilledIcon } from './icons'
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
    className: 'bg-[#F5821F] text-white',
  }
}

export default function StudentCard({
  student,
  className,
  onStatusToggle,
  variant = 'row',
}: StudentCardProps) {
  const fullName = `${student.first_name} ${student.last_name}`
  const classLabel = className
    ? className.startsWith('כיתה')
      ? className
      : `כיתה ${className}`
    : null
  const badge = statusBadge(student.current_status)

  const [expanded, setExpanded] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [sortBy, setSortBy] = useState<'created' | 'target'>('created')
  const [isSavingRemark, setIsSavingRemark] = useState(false)
  const [writeError, setWriteError] = useState<string | null>(null)

  const remarks = useRemarks(student.school_id, student.id)
  const filteredRemarks = useMemo(
    () => remarks.filter((r) => r.text && r.text.trim()),
    [remarks],
  )

  const sortedRemarks = useMemo(() => {
    const items = [...filteredRemarks]
    if (sortBy === 'created') {
      items.sort((a, b) => {
        const aTime = a.created_at?.toMillis?.() ?? 0
        const bTime = b.created_at?.toMillis?.() ?? 0
        return bTime - aTime
      })
      return items
    }
    items.sort((a, b) => {
      if (!a.target_date && !b.target_date) return 0
      if (!a.target_date) return 1
      if (!b.target_date) return -1
      return a.target_date.localeCompare(b.target_date)
    })
    return items
  }, [filteredRemarks, sortBy])

  async function handleSaveRemark() {
    if (!noteText.trim() || isSavingRemark) return
    setIsSavingRemark(true)
    try {
      await addRemark(
        student.school_id,
        student.id,
        todayDateString(),
        noteText,
        targetDate || null,
      )
      setNoteText('')
      setTargetDate('')
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
      className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full font-bold transition-colors duration-300 ${
        variant === 'row'
          ? 'min-h-8 min-w-[5.25rem] px-2.5 text-xs'
          : 'min-h-9 min-w-[5.25rem] px-3 text-sm'
      } ${badge.className}`}
    >
      {badge.label}
      {variant === 'directory' && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M15 6 9 12l6 6" />
        </svg>
      )}
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
        <ChevronDownIcon
          className="h-5 w-5 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(90deg)' }}
        />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={`פרטים נוספים עבור ${fullName}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3a3a3c]"
      >
        <ChevronDownIcon
          className="h-4 w-4 text-[#9A9A9F] transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        />
      </button>
    )

  return (
    <article
      className={`box-border rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[#1c1c1e] px-4 ${
        variant === 'row' ? 'mb-1.5 py-2' : 'mb-2.5 py-3'
      }`}
    >
      {variant === 'directory' ? (
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
            style={{
              background: 'var(--nm-bg-card)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#0071e3',
            }}
          >
            <PersonFilledIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-[15px] font-semibold text-[#f5f5f7]">{fullName}</p>
            {classLabel && (
              <p className="mt-0.5 truncate text-[13px] leading-none text-[#98989d]">{classLabel}</p>
            )}
          </div>
          {expandButton}
          {statusButton}
        </div>
      ) : (
        <div className="flex min-h-11 items-center gap-2">
          {statusButton}
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-[14px] font-semibold text-[#f5f5f7]">{fullName}</p>
            {classLabel && (
              <p className="truncate text-[11px] text-[#98989d]">{classLabel}</p>
            )}
          </div>
          {expandButton}
        </div>
      )}

      {expanded && (
        <div className="mt-2 w-full overflow-hidden">
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="הוסף הערה..."
            rows={2}
            className="w-full box-border resize-none rounded-xl border border-[#3a3a3c] bg-[#2c2c2e] px-3 py-2 text-sm text-white outline-none"
          />
          <div className="flex items-center justify-between gap-2 mt-2 w-full box-border">
            <button
              type="button"
              disabled={isSavingRemark || !noteText.trim()}
              onClick={() => void handleSaveRemark()}
              className="shrink-0 rounded-full bg-[#0071e3] px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingRemark ? <Spinner compact onDark /> : 'שמור'}
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative flex min-w-0 items-center gap-2 cursor-pointer">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 ${targetDate ? 'text-[#0071e3]' : 'text-[#98989d]'}`}
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
                <span className={`truncate ${targetDate ? 'text-sm text-[#0071e3]' : 'text-sm text-[#98989d]'}`}>
                  {targetDate ? formatRemarkDate(targetDate) : 'הוסף תאריך יעד'}
                </span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  aria-label="הוסף תאריך יעד"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              {targetDate && (
                <button
                  type="button"
                  aria-label="ביטול תאריך יעד"
                  onClick={() => setTargetDate('')}
                  className="relative z-10 flex items-center gap-1 rounded-full bg-[#3a3a3c] px-2.5 py-1 text-xs font-medium text-[#98989d]"
                >
                  ביטול
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="12"
                    height="12"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {writeError && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              {writeError}
            </p>
          )}

          {filteredRemarks.length === 0 ? (
            <p className="mt-3 text-center text-sm text-[#98989d]">אין הערות</p>
          ) : (
            <>
              <div className="mx-auto mt-3 flex max-w-full w-fit rounded-full bg-[#2c2c2e] p-1">
                <button
                  type="button"
                  onClick={() => setSortBy('created')}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    sortBy === 'created' ? 'bg-[#0071e3] text-white' : 'bg-transparent text-[#98989d]'
                  }`}
                >
                  תאריך יצירה
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('target')}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    sortBy === 'target' ? 'bg-[#0071e3] text-white' : 'bg-transparent text-[#98989d]'
                  }`}
                >
                  תאריך יעד
                </button>
              </div>
              <div className="mt-3 w-full overflow-hidden">
              <div
                className="flex gap-3 overflow-x-auto pb-2 w-full"
                style={{ scrollbarWidth: 'none' }}
              >
                {sortedRemarks.map((remark) => (
                  <article
                    key={remark.id}
                    className="relative w-[min(200px,100%)] max-w-[240px] flex-shrink-0 rounded-2xl border border-[#3a3a3c] bg-[#2c2c2e] p-3"
                  >
                    <button
                      type="button"
                      onClick={() => void handleDeleteRemark(remark.id)}
                      aria-label="מחק הערה"
                      className="absolute top-2 left-2 border-0 bg-transparent p-0 text-[#98989d] hover:text-red-400"
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
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                    <p className="line-clamp-3 pe-5 text-sm text-white">{remark.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#98989d]">
                        {formatRemarkDate(remark.date)}
                      </span>
                      {remark.target_date && (
                        <span className="text-xs text-[#5BA0FF]">
                          📅 {formatRemarkDate(remark.target_date)}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  )
}
