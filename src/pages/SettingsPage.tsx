import { collection, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Spinner from '../components/Spinner'
import {
  AccountIcon,
  AddClassIcon,
  AddStudentIcon,
  ChevronDownIcon,
  ImportIcon,
  ManageBusesIcon,
} from '../components/icons'
import { useBuses, useClasses } from '../hooks/useSchoolData'
import { getSchoolId, logout } from '../lib/auth'
import { usePageTitle } from '../lib/page-title'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import type { Bus, SchoolClass, Student } from '../types'
import * as XLSX from 'xlsx'

type Feedback = { type: 'success' | 'error'; text: string } | null
type TransportMode = Student['transport_mode']

const INPUT_CLASS =
  'mt-1 box-border min-h-11 w-full overflow-hidden rounded-[14px] border border-[#222A3A] bg-[#1A2030] px-3 py-2 text-base text-white outline-none focus:border-[#3D90F0] focus:ring-2 focus:ring-[#3D90F0]/30'
const BUTTON_CLASS =
  'flex min-h-11 w-full items-center justify-center rounded-full bg-[#3D90F0] px-4 py-2 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60'
const REQUIRED_IMPORT_HEADERS = [
  'שם פרטי',
  'שם משפחה',
  'כיתה',
  'אוטובוס הגעה',
  'אוטובוס עזיבה',
] as const
const BATCH_LIMIT = 450

function FeedbackMessage({ message }: { message: Feedback }) {
  if (!message) return null
  return (
    <p
      className={
        message.type === 'success'
          ? 'whitespace-pre-wrap text-sm text-[#278A3E]'
          : 'whitespace-pre-wrap text-sm text-red-400'
      }
      role="status"
    >
      {message.text}
    </p>
  )
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <details className="group box-border w-full overflow-hidden rounded-[20px] bg-[#151A28]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 items-center justify-center text-[#5BA0FF]">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-right text-base font-medium text-white">
          {title}
        </span>
        <ChevronDownIcon className="h-5 w-5 text-[#A0A0A6] transition-transform group-open:rotate-180" />
      </summary>
      <div className="box-border w-full space-y-3 overflow-hidden border-t border-[#222A3A] px-4 py-3">
        {children}
      </div>
    </details>
  )
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block w-full text-sm font-medium text-[#C0C0C6]">
      {children}
    </label>
  )
}

async function commitWrites(
  writes: Array<(batch: ReturnType<typeof writeBatch>) => void>,
) {
  for (let index = 0; index < writes.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const write of writes.slice(index, index + BATCH_LIMIT)) {
      write(batch)
    }
    await batch.commit()
  }
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    normalized[String(key).replace(/^\uFEFF/, '').trim()] = String(value ?? '').trim()
  }
  return normalized
}

export default function SettingsPage() {
  const { setTitle } = usePageTitle()
  const schoolId = getSchoolId()
  const { items: classes } = useClasses(schoolId)
  const { items: buses } = useBuses(schoolId)

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((a, b) =>
        a.name.localeCompare(b.name, 'he', { numeric: true }),
      ),
    [classes],
  )
  const sortedBuses = useMemo(
    () =>
      [...buses].sort((a, b) =>
        a.label.localeCompare(b.label, 'he', { numeric: true }),
      ),
    [buses],
  )

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [classId, setClassId] = useState('')
  const [transportMode, setTransportMode] = useState<TransportMode>('bus')
  const [arrivalBusId, setArrivalBusId] = useState('')
  const [departureBusId, setDepartureBusId] = useState('')
  const [studentFeedback, setStudentFeedback] = useState<Feedback>(null)
  const [isAddingStudent, setIsAddingStudent] = useState(false)

  const [newClassName, setNewClassName] = useState('')
  const [classFeedback, setClassFeedback] = useState<Feedback>(null)
  const [isAddingClass, setIsAddingClass] = useState(false)

  const [newBusLabel, setNewBusLabel] = useState('')
  const [busFeedback, setBusFeedback] = useState<Feedback>(null)
  const [isAddingBus, setIsAddingBus] = useState(false)

  const [importFeedback, setImportFeedback] = useState<Feedback>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    setTitle('הגדרות')
  }, [setTitle])

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStudentFeedback(null)
    if (!schoolId) return

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast || !classId) {
      setStudentFeedback({ type: 'error', text: 'יש למלא שם פרטי, שם משפחה וכיתה' })
      return
    }
    if (transportMode === 'bus' && !arrivalBusId) {
      setStudentFeedback({ type: 'error', text: 'יש לבחור אוטובוס הגעה' })
      return
    }

    setIsAddingStudent(true)
    try {
      const studentRef = doc(collection(db, 'schools', schoolId, 'students'))
      const payload: Student = {
        id: studentRef.id,
        school_id: schoolId,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        class_id: classId,
        transport_mode: transportMode,
        arrival_bus_id: transportMode === 'bus' ? arrivalBusId : null,
        departure_bus_id:
          transportMode === 'bus' ? departureBusId || arrivalBusId : null,
        current_status: 'not_arrived',
        last_status_changed_at: null,
      }
      await setDoc(studentRef, payload)
      setFirstName('')
      setLastName('')
      setClassId('')
      setTransportMode('bus')
      setArrivalBusId('')
      setDepartureBusId('')
      setStudentFeedback({ type: 'success', text: 'התלמיד נוסף בהצלחה' })
    } catch (error) {
      console.error(error)
      setStudentFeedback({ type: 'error', text: WRITE_ERROR })
    } finally {
      setIsAddingStudent(false)
    }
  }

  async function handleAddClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setClassFeedback(null)
    if (!schoolId) return
    const name = newClassName.trim()
    if (!name) {
      setClassFeedback({ type: 'error', text: 'יש להזין שם כיתה' })
      return
    }

    setIsAddingClass(true)
    try {
      const classRef = doc(collection(db, 'schools', schoolId, 'classes'))
      const payload: SchoolClass = {
        id: classRef.id,
        school_id: schoolId,
        name,
      }
      await setDoc(classRef, payload)
      setNewClassName('')
      setClassFeedback({ type: 'success', text: 'הכיתה נוספה בהצלחה' })
    } catch (error) {
      console.error(error)
      setClassFeedback({ type: 'error', text: WRITE_ERROR })
    } finally {
      setIsAddingClass(false)
    }
  }

  async function handleDeleteClass(schoolClass: SchoolClass) {
    if (!schoolId) return
    if (!window.confirm(`למחוק את הכיתה ${schoolClass.name}?`)) return
    try {
      await deleteDoc(doc(db, 'schools', schoolId, 'classes', schoolClass.id))
      setClassFeedback({ type: 'success', text: `הכיתה ${schoolClass.name} נמחקה` })
    } catch (error) {
      console.error(error)
      setClassFeedback({ type: 'error', text: WRITE_ERROR })
    }
  }

  async function handleAddBus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusFeedback(null)
    if (!schoolId) return
    const label = newBusLabel.trim()
    if (!label) {
      setBusFeedback({ type: 'error', text: 'יש להזין מספר/שם אוטובוס' })
      return
    }

    setIsAddingBus(true)
    try {
      const busRef = doc(collection(db, 'schools', schoolId, 'buses'))
      const payload: Bus = {
        id: busRef.id,
        school_id: schoolId,
        label,
        departed: false,
        departed_at: null,
      }
      await setDoc(busRef, payload)
      setNewBusLabel('')
      setBusFeedback({ type: 'success', text: 'האוטובוס נוסף בהצלחה' })
    } catch (error) {
      console.error(error)
      setBusFeedback({ type: 'error', text: WRITE_ERROR })
    } finally {
      setIsAddingBus(false)
    }
  }

  async function handleDeleteBus(bus: Bus) {
    if (!schoolId) return
    if (!window.confirm(`למחוק את אוטובוס ${bus.label}?`)) return
    try {
      await deleteDoc(doc(db, 'schools', schoolId, 'buses', bus.id))
      setBusFeedback({ type: 'success', text: `אוטובוס ${bus.label} נמחק` })
    } catch (error) {
      console.error(error)
      setBusFeedback({ type: 'error', text: WRITE_ERROR })
    }
  }

  async function handleImportFile(file: File) {
    if (!schoolId) return
    const currentSchoolId = schoolId
    setImportFeedback(null)
    setIsImporting(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        setImportFeedback({ type: 'error', text: 'הקובץ ריק' })
        return
      }
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) {
        setImportFeedback({ type: 'error', text: 'לא נמצא גיליון בקובץ' })
        return
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      })
      if (rawRows.length === 0) {
        setImportFeedback({ type: 'error', text: 'הקובץ לא מכיל שורות תלמידים' })
        return
      }

      const rows = rawRows.map(normalizeRow)
      const headers = Object.keys(rows[0] ?? {})
      const missingHeaders = REQUIRED_IMPORT_HEADERS.filter(
        (header) => !headers.includes(header),
      )
      if (missingHeaders.length > 0) {
        setImportFeedback({
          type: 'error',
          text: `חסרות עמודות: ${missingHeaders.join(', ')}`,
        })
        return
      }

      const rowErrors: string[] = []
      const parsed: Array<{
        firstName: string
        lastName: string
        className: string
        arrivalLabel: string
        departureLabel: string
      }> = []

      rows.forEach((row, index) => {
        const parsedFirst = row['שם פרטי'] ?? ''
        const parsedLast = row['שם משפחה'] ?? ''
        const parsedClass = row['כיתה'] ?? ''
        if (!parsedFirst || !parsedLast) {
          rowErrors.push(`שורה ${index + 2}: חסר שם פרטי או שם משפחה`)
          return
        }
        if (!parsedClass) {
          rowErrors.push(`שורה ${index + 2}: חסרה כיתה`)
          return
        }
        parsed.push({
          firstName: parsedFirst,
          lastName: parsedLast,
          className: parsedClass,
          arrivalLabel: row['אוטובוס הגעה'] ?? '',
          departureLabel: row['אוטובוס עזיבה'] ?? '',
        })
      })

      if (rowErrors.length > 0) {
        setImportFeedback({ type: 'error', text: rowErrors.join('\n') })
        return
      }

      const classIdByName = new Map(classes.map((item) => [item.name, item.id]))
      const busIdByLabel = new Map(buses.map((item) => [item.label, item.id]))
      const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = []
      let newClassCount = 0
      let newBusCount = 0

      function ensureClassId(name: string): string {
        const existing = classIdByName.get(name)
        if (existing) return existing
        const classRef = doc(collection(db, 'schools', currentSchoolId, 'classes'))
        classIdByName.set(name, classRef.id)
        writes.push((batch) =>
          batch.set(classRef, {
            id: classRef.id,
            school_id: currentSchoolId,
            name,
          } satisfies SchoolClass),
        )
        newClassCount += 1
        return classRef.id
      }

      function ensureBusId(label: string): string {
        const existing = busIdByLabel.get(label)
        if (existing) return existing
        const busRef = doc(collection(db, 'schools', currentSchoolId, 'buses'))
        busIdByLabel.set(label, busRef.id)
        writes.push((batch) =>
          batch.set(busRef, {
            id: busRef.id,
            school_id: currentSchoolId,
            label,
            departed: false,
            departed_at: null,
          } satisfies Bus),
        )
        newBusCount += 1
        return busRef.id
      }

      const studentWrites: Array<(batch: ReturnType<typeof writeBatch>) => void> = []
      for (const row of parsed) {
        const resolvedClassId = ensureClassId(row.className)
        const arrivalLabel = row.arrivalLabel || row.departureLabel
        const departureLabel = row.departureLabel || row.arrivalLabel
        const hasBus = Boolean(arrivalLabel)
        const studentRef = doc(collection(db, 'schools', currentSchoolId, 'students'))
        const payload: Student = {
          id: studentRef.id,
          school_id: currentSchoolId,
          first_name: row.firstName,
          last_name: row.lastName,
          class_id: resolvedClassId,
          transport_mode: hasBus ? 'bus' : 'independent',
          arrival_bus_id: hasBus ? ensureBusId(arrivalLabel) : null,
          departure_bus_id: hasBus ? ensureBusId(departureLabel) : null,
          current_status: 'not_arrived',
          last_status_changed_at: null,
        }
        studentWrites.push((batch) => batch.set(studentRef, payload))
      }

      await commitWrites([...writes, ...studentWrites])
      setImportFeedback({
        type: 'success',
        text: `יובאו ${parsed.length} תלמידים, ${newClassCount} כיתות חדשות, ${newBusCount} אוטובוסים חדשים`,
      })
    } catch (error) {
      console.error(error)
      setImportFeedback({ type: 'error', text: WRITE_ERROR })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="box-border w-full overflow-hidden px-4 py-4">
      <div className="flex w-full min-w-0 flex-col gap-3 overflow-hidden">
        <SectionCard title="חשבון" icon={<AccountIcon className="h-6 w-6" />}>
          <p className="text-sm text-[#8494AD]">יציאה תחזיר אותך למסך ההתחברות.</p>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-red-400/40 bg-[#1A2030] px-4 py-2 text-base font-medium text-red-400"
          >
            התנתקות
          </button>
        </SectionCard>

        <SectionCard title="הוספת תלמיד" icon={<AddStudentIcon className="h-6 w-6" />}>
          <form className="flex w-full min-w-0 flex-col gap-3 overflow-hidden" onSubmit={handleAddStudent}>
            <div className="box-border w-full min-w-0 overflow-hidden">
              <FieldLabel htmlFor="student-first">שם פרטי</FieldLabel>
              <input
                id="student-first"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
            <div className="box-border w-full min-w-0 overflow-hidden">
              <FieldLabel htmlFor="student-last">שם משפחה</FieldLabel>
              <input
                id="student-last"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
            <div className="box-border w-full min-w-0 overflow-hidden">
              <FieldLabel htmlFor="student-class">כיתה</FieldLabel>
              <select
                id="student-class"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                required
                className={INPUT_CLASS}
              >
                <option value="">בחר כיתה</option>
                {sortedClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="box-border w-full min-w-0 overflow-hidden">
              <FieldLabel htmlFor="student-transport">אמצעי הגעה</FieldLabel>
              <select
                id="student-transport"
                value={transportMode}
                onChange={(event) =>
                  setTransportMode(event.target.value as TransportMode)
                }
                className={INPUT_CLASS}
              >
                <option value="bus">אוטובוס</option>
                <option value="independent">עצמאי</option>
                <option value="family">משפחה</option>
              </select>
            </div>
            {transportMode === 'bus' && (
              <>
                <div className="box-border w-full min-w-0 overflow-hidden">
                  <FieldLabel htmlFor="student-arrival">אוטובוס הגעה</FieldLabel>
                  <select
                    id="student-arrival"
                    value={arrivalBusId}
                    onChange={(event) => {
                      const next = event.target.value
                      setArrivalBusId(next)
                      if (!departureBusId || departureBusId === arrivalBusId) {
                        setDepartureBusId(next)
                      }
                    }}
                    required
                    className={INPUT_CLASS}
                  >
                    <option value="">בחר אוטובוס</option>
                    {sortedBuses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        אוטובוס {bus.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="box-border w-full min-w-0 overflow-hidden">
                  <FieldLabel htmlFor="student-departure">אוטובוס עזיבה</FieldLabel>
                  <select
                    id="student-departure"
                    value={departureBusId}
                    onChange={(event) => setDepartureBusId(event.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">בחר אוטובוס</option>
                    {sortedBuses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        אוטובוס {bus.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <FeedbackMessage message={studentFeedback} />
            <button type="submit" disabled={isAddingStudent} className={BUTTON_CLASS}>
              {isAddingStudent ? <Spinner compact onDark /> : 'הוסף תלמיד'}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="הוספת כיתה" icon={<AddClassIcon className="h-6 w-6" />}>
          <form className="flex w-full min-w-0 flex-col gap-3 overflow-hidden" onSubmit={handleAddClass}>
            <div className="box-border w-full min-w-0 overflow-hidden">
              <FieldLabel htmlFor="class-name">שם הכיתה</FieldLabel>
              <input
                id="class-name"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
            <FeedbackMessage message={classFeedback} />
            <button type="submit" disabled={isAddingClass} className={BUTTON_CLASS}>
              {isAddingClass ? <Spinner compact onDark /> : 'הוסף כיתה'}
            </button>
          </form>
          <ul className="divide-y divide-[#222A3A]">
            {sortedClasses.map((schoolClass) => (
              <li
                key={schoolClass.id}
                className="flex min-h-11 items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-white">{schoolClass.name}</span>
                <button
                  type="button"
                  onClick={() => void handleDeleteClass(schoolClass)}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-400"
                >
                  מחק
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="ניהול אוטובוסים" icon={<ManageBusesIcon className="h-6 w-6" />}>
          <form className="flex w-full min-w-0 flex-col gap-3 overflow-hidden" onSubmit={handleAddBus}>
            <div className="box-border w-full min-w-0 overflow-hidden">
              <FieldLabel htmlFor="bus-label">מספר/שם אוטובוס</FieldLabel>
              <input
                id="bus-label"
                value={newBusLabel}
                onChange={(event) => setNewBusLabel(event.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
            <FeedbackMessage message={busFeedback} />
            <button type="submit" disabled={isAddingBus} className={BUTTON_CLASS}>
              {isAddingBus ? <Spinner compact onDark /> : 'הוסף אוטובוס'}
            </button>
          </form>
          <ul className="divide-y divide-[#222A3A]">
            {sortedBuses.map((bus) => (
              <li
                key={bus.id}
                className="flex min-h-11 items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-white">אוטובוס {bus.label}</span>
                <button
                  type="button"
                  onClick={() => void handleDeleteBus(bus)}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-400"
                >
                  מחק
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="ייבוא תלמידים" icon={<ImportIcon className="h-6 w-6" />}>
          <p className="text-sm text-[#8494AD]">
            העלה קובץ עם העמודות: שם פרטי, שם משפחה, כיתה, אוטובוס הגעה, אוטובוס עזיבה
          </p>
          <FieldLabel htmlFor="import-file">קובץ CSV / Excel</FieldLabel>
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            disabled={isImporting}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImportFile(file)
              event.target.value = ''
            }}
            className="box-border block w-full overflow-hidden text-sm text-[#C0C0C6] file:me-3 file:min-h-11 file:rounded-full file:border-0 file:bg-[#1A2030] file:px-4 file:text-sm file:font-medium file:text-[#5BA0FF]"
          />
          {isImporting && <Spinner />}
          <FeedbackMessage message={importFeedback} />
        </SectionCard>
      </div>
    </div>
  )
}
