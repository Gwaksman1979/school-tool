import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { useState } from 'react'
import Spinner from '../components/Spinner'
import { getSchoolId } from '../lib/auth'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import type { Bus, SchoolClass, Student } from '../types'

const BATCH_LIMIT = 450

const BUS_LABELS = [
  'תל אביב 1',
  'תל אביב 2',
  'תל אביב 3',
  'תל אביב 4',
  'תל אביב 5',
  'תל אביב 6',
  'תל אביב 7',
  'תל אביב 8',
  'תל אביב 9',
  'תל אביב 10',
  'תל אביב 11',
  'תל אביב 12',
  'תל אביב 13',
  'תל אביב 14',
  'תל אביב 15',
  'תל אביב 16',
  'תל אביב 17',
  'תל אביב 20',
  'תל אביב 21',
  'רמת גן',
] as const

const CLASS_NAMES = [
  'אחווה',
  'אחווה 1',
  'אחווה 2',
  'אחווה 3',
  'אחווה 4',
  'עוז 1',
  'עוז 2',
  'עוז 3',
  'עוז 4',
  'עוז 5',
  'עמית 1',
  'עמית 2',
  'עמית 3',
  'עמית 4',
  'עמית 5',
  'רעות 1',
  'רעות 2',
  'רעות 3',
  'רעות 4',
  'רעות 5',
] as const

const DELETE_COLLECTIONS = [
  'students',
  'buses',
  'classes',
  'meta',
  'attendance_events',
] as const

type SeedStudent = {
  first_name: string
  last_name: string
  bus_label: string
  class_name: string | null
}

const STUDENTS: SeedStudent[] = [
  { first_name: 'יונתן', last_name: 'פלדמן', bus_label: 'תל אביב 1', class_name: 'רעות 3' },
  { first_name: 'עידו', last_name: 'משיח', bus_label: 'תל אביב 1', class_name: 'עוז 1' },
  { first_name: 'עומר', last_name: 'ויצמן', bus_label: 'תל אביב 1', class_name: 'רעות 2' },
  { first_name: 'עילאי', last_name: 'לוגסי', bus_label: 'תל אביב 1', class_name: 'עמית 4' },
  { first_name: 'עידו', last_name: 'חובב', bus_label: 'תל אביב 1', class_name: 'עמית 4' },
  { first_name: 'רווח', last_name: 'ליעד', bus_label: 'תל אביב 1', class_name: 'רעות 5' },
  { first_name: 'אלון', last_name: 'מיכאל', bus_label: 'תל אביב 1', class_name: 'עוז 3' },
  { first_name: 'זאינדנברג', last_name: 'רפאל', bus_label: 'תל אביב 1', class_name: 'עמית 5' },
  { first_name: 'עירוני', last_name: 'דוד', bus_label: 'תל אביב 2', class_name: 'עוז 1' },
  { first_name: 'גולדנר', last_name: 'תום', bus_label: 'תל אביב 2', class_name: 'רעות 3' },
  { first_name: 'נועה', last_name: 'וקס', bus_label: 'תל אביב 3', class_name: 'אחווה 4' },
  { first_name: 'רוני', last_name: 'שפירא', bus_label: 'תל אביב 3', class_name: 'אחווה 2' },
  { first_name: 'יהלי', last_name: 'גפני', bus_label: 'תל אביב 4', class_name: 'עמית 2' },
  { first_name: 'תום', last_name: 'גורה', bus_label: 'תל אביב 4', class_name: 'עמית 5' },
  { first_name: 'אופיר', last_name: 'דנוך', bus_label: 'תל אביב 4', class_name: 'עוז 3' },
  { first_name: 'עומר', last_name: 'קוזק', bus_label: 'תל אביב 4', class_name: 'רעות 1' },
  { first_name: 'ענבר', last_name: 'נמרוד', bus_label: 'תל אביב 4', class_name: 'עוז 2' },
  { first_name: 'טל', last_name: 'ורשר', bus_label: 'תל אביב 4', class_name: 'אחווה 3' },
  { first_name: 'לב', last_name: 'זרחיהו', bus_label: 'תל אביב 4', class_name: 'עמית 2' },
  { first_name: 'איתמר', last_name: 'ברלוביץ', bus_label: 'תל אביב 5', class_name: 'אחווה 2' },
  { first_name: 'יונתן', last_name: 'וולך', bus_label: 'תל אביב 5', class_name: 'רעות 1' },
  { first_name: 'פרץ', last_name: 'אריאל', bus_label: 'תל אביב 5', class_name: 'אחווה 2' },
  { first_name: 'אריאל', last_name: 'קנופ', bus_label: 'תל אביב 6', class_name: 'עמית 5' },
  { first_name: 'סופרין', last_name: 'יעל', bus_label: 'תל אביב 6', class_name: 'עמית 5' },
  { first_name: 'איתי', last_name: 'הס', bus_label: 'תל אביב 6', class_name: 'רעות 1' },
  { first_name: 'גיא', last_name: 'גלר', bus_label: 'תל אביב 6', class_name: 'אחווה 3' },
  { first_name: 'יהלי', last_name: 'ברכה', bus_label: 'תל אביב 6', class_name: 'עוז 3' },
  { first_name: 'בן', last_name: 'צפניק', bus_label: 'תל אביב 6', class_name: 'עוז 3' },
  { first_name: 'אריאל', last_name: 'רמתי', bus_label: 'תל אביב 6', class_name: 'עמית 1' },
  { first_name: 'כהן', last_name: 'דן', bus_label: 'תל אביב 6', class_name: 'עוז 5' },
  { first_name: 'דוד', last_name: 'עירוני', bus_label: 'תל אביב 6', class_name: 'עוז 1' },
  { first_name: 'תום', last_name: 'גולדנר', bus_label: 'תל אביב 6', class_name: 'רעות 3' },
  { first_name: 'שלמה', last_name: 'קאלין', bus_label: 'תל אביב 7', class_name: null },
  { first_name: 'מאיה', last_name: "תורג'מן", bus_label: 'תל אביב 7', class_name: 'רעות 2' },
  { first_name: 'שרלוט', last_name: 'רובינשטיין', bus_label: 'תל אביב 7', class_name: null },
  { first_name: 'אריאל', last_name: 'ורשבסקי', bus_label: 'תל אביב 7', class_name: 'עמית 2' },
  { first_name: 'טגורי', last_name: 'הילל', bus_label: 'תל אביב 7', class_name: 'עמית 5' },
  { first_name: 'נועם', last_name: 'חפץ', bus_label: 'תל אביב 8', class_name: 'עמית 2' },
  { first_name: 'אריאל', last_name: 'כספי', bus_label: 'תל אביב 8', class_name: 'עוז 5' },
  { first_name: 'הלל', last_name: 'שפיצר', bus_label: 'תל אביב 8', class_name: 'עוז 5' },
  { first_name: 'עדי', last_name: 'דבך', bus_label: 'תל אביב 8', class_name: 'עמית 1' },
  { first_name: 'מאור', last_name: 'רובינסון', bus_label: 'תל אביב 8', class_name: 'אחווה 4' },
  { first_name: 'גיל', last_name: 'תמיר', bus_label: 'תל אביב 8', class_name: 'רעות 5' },
  { first_name: 'אמה', last_name: 'שון', bus_label: 'תל אביב 8', class_name: 'עמית 1' },
  { first_name: 'דניאל', last_name: 'דאש', bus_label: 'תל אביב 8', class_name: 'עמית 1' },
  { first_name: 'צפריר', last_name: 'יובל', bus_label: 'תל אביב 8', class_name: 'עמית 2' },
  { first_name: 'מרק', last_name: 'פאינס', bus_label: 'תל אביב 8', class_name: 'רעות 4' },
  { first_name: 'ליה', last_name: 'לוי', bus_label: 'תל אביב 9', class_name: 'אחווה 2' },
  { first_name: 'ליה', last_name: 'כדורי', bus_label: 'תל אביב 9', class_name: 'אחווה 2' },
  { first_name: 'איתן', last_name: 'שילון', bus_label: 'תל אביב 9', class_name: 'עמית 1' },
  { first_name: 'עופרי', last_name: 'שדה', bus_label: 'תל אביב 9', class_name: 'רעות 3' },
  { first_name: 'וינטה', last_name: 'ברק', bus_label: 'תל אביב 9', class_name: null },
  { first_name: 'טל', last_name: 'שדה', bus_label: 'תל אביב 9', class_name: 'רעות 2' },
  { first_name: 'מיכל', last_name: 'אריאל', bus_label: 'תל אביב 10', class_name: 'אחווה' },
  { first_name: 'גיא', last_name: 'כוכב', bus_label: 'תל אביב 10', class_name: 'עוז 2' },
  { first_name: 'אביתר', last_name: 'שלז', bus_label: 'תל אביב 10', class_name: 'עוז 4' },
  { first_name: 'בוטבול', last_name: 'לני', bus_label: 'תל אביב 10', class_name: 'עוז 4' },
  { first_name: 'נועה', last_name: 'קשת', bus_label: 'תל אביב 10', class_name: 'אחווה 1' },
  { first_name: 'עלמה', last_name: 'רוזנדל', bus_label: 'תל אביב 10', class_name: 'עמית 2' },
  { first_name: 'אלכס', last_name: 'שקד', bus_label: 'תל אביב 10', class_name: 'עמית 1' },
  { first_name: 'עידו', last_name: 'לוי', bus_label: 'תל אביב 11', class_name: 'רעות 4' },
  { first_name: 'גבע', last_name: 'עמית', bus_label: 'תל אביב 11', class_name: null },
  { first_name: 'שדה', last_name: 'יואב', bus_label: 'תל אביב 11', class_name: null },
  { first_name: 'סולאר', last_name: 'מרק', bus_label: 'תל אביב 11', class_name: 'אחווה 2' },
  { first_name: 'פיליפ', last_name: 'יאנקלנג', bus_label: 'תל אביב 11', class_name: 'רעות 1' },
  { first_name: 'עבודי', last_name: 'אבו טאלכ', bus_label: 'תל אביב 12', class_name: 'רעות 5' },
  { first_name: 'אדיר', last_name: 'ויזמן', bus_label: 'תל אביב 12', class_name: 'אחווה 4' },
  { first_name: 'גרבוע', last_name: 'טאהר', bus_label: 'תל אביב 12', class_name: 'אחווה 4' },
  { first_name: 'לוי', last_name: 'אדיר', bus_label: 'תל אביב 12', class_name: 'אחווה 3' },
  { first_name: 'כרואן', last_name: 'אדם', bus_label: 'תל אביב 12', class_name: 'עוז 4' },
  { first_name: 'דניאל', last_name: 'עמרם', bus_label: 'תל אביב 12', class_name: 'רעות 1' },
  { first_name: 'טומי', last_name: 'פרי חדש', bus_label: 'תל אביב 12', class_name: 'עמית 2' },
  { first_name: 'עידו', last_name: 'צור', bus_label: 'תל אביב 13', class_name: 'רעות 4' },
  { first_name: 'אפנעים', last_name: 'בן', bus_label: 'תל אביב 13', class_name: 'עמית 3' },
  { first_name: 'סשה', last_name: "צ'יטייב", bus_label: 'תל אביב 14', class_name: 'עוז 2' },
  { first_name: "בנג'מין", last_name: 'פינדה', bus_label: 'תל אביב 14', class_name: 'אחווה 1' },
  { first_name: 'גבריאל', last_name: 'דינקה', bus_label: 'תל אביב 14', class_name: 'אחווה 1' },
  { first_name: 'קדוש', last_name: 'נויה', bus_label: 'תל אביב 14', class_name: 'רעות 5' },
  { first_name: 'נתנאל', last_name: 'מיכאלי', bus_label: 'תל אביב 14', class_name: 'אחווה 1' },
  { first_name: 'אלפרד', last_name: 'שושה', bus_label: 'תל אביב 14', class_name: 'אחווה 1' },
  { first_name: 'שלו', last_name: 'דאבוש', bus_label: 'תל אביב 14', class_name: 'עמית 4' },
  { first_name: 'אריאל', last_name: 'בוחבוט', bus_label: 'תל אביב 15', class_name: 'אחווה 1' },
  { first_name: 'אליה', last_name: 'דואיר', bus_label: 'תל אביב 15', class_name: 'עוז 3' },
  { first_name: 'אופק', last_name: 'לוי', bus_label: 'תל אביב 15', class_name: 'עוז 1' },
  { first_name: 'יונתן', last_name: 'שאער', bus_label: 'תל אביב 15', class_name: 'עוז 3' },
  { first_name: 'בועז', last_name: 'אראל', bus_label: 'תל אביב 15', class_name: 'עוז 5' },
  { first_name: 'אלחי', last_name: 'חמדני', bus_label: 'תל אביב 15', class_name: 'עמית 3' },
  { first_name: 'אקרמן', last_name: 'מיכאל', bus_label: 'תל אביב 16', class_name: 'עוז 4' },
  { first_name: 'אופק', last_name: 'זוהר', bus_label: 'תל אביב 16', class_name: 'רעות 1' },
  { first_name: 'כולי', last_name: 'יותם', bus_label: 'תל אביב 16', class_name: null },
  { first_name: 'גולן', last_name: 'רוזן', bus_label: 'תל אביב 16', class_name: 'אחווה 1' },
  { first_name: 'אורי', last_name: 'יצחק', bus_label: 'תל אביב 16', class_name: 'עוז 3' },
  { first_name: 'נתנאל', last_name: 'בנימין', bus_label: 'תל אביב 16', class_name: 'עוז 1' },
  { first_name: 'מאור', last_name: 'דרעי', bus_label: 'תל אביב 16', class_name: 'עמית 4' },
  { first_name: 'ליאב', last_name: 'אבני', bus_label: 'תל אביב 17', class_name: 'עוז 1' },
  { first_name: 'אופק', last_name: 'דוד', bus_label: 'תל אביב 17', class_name: 'אחווה 1' },
  { first_name: 'אמיר', last_name: 'סמיונוב', bus_label: 'תל אביב 17', class_name: 'אחווה 1' },
  { first_name: 'יצחק', last_name: 'לוי', bus_label: 'תל אביב 17', class_name: null },
  { first_name: 'מישה', last_name: 'קינוסיאן', bus_label: 'תל אביב 17', class_name: 'אחווה 3' },
  { first_name: 'אריה', last_name: 'בקר', bus_label: 'תל אביב 17', class_name: 'עוז 3' },
  { first_name: 'חן', last_name: 'נעה', bus_label: 'תל אביב 20', class_name: 'עוז 4' },
  { first_name: 'ליאן', last_name: 'אליאס', bus_label: 'תל אביב 20', class_name: 'עוז 1' },
  { first_name: 'בכר', last_name: 'אריאל', bus_label: 'תל אביב 21', class_name: 'עוז 4' },
  { first_name: 'שחר', last_name: 'איתי', bus_label: 'רמת גן', class_name: 'רעות 5' },
  { first_name: 'פורת', last_name: 'תמר', bus_label: 'רמת גן', class_name: 'רעות 5' },
  { first_name: 'שון', last_name: 'אמה', bus_label: 'רמת גן', class_name: 'עמית 1' },
]

const BUTTON_CLASS =
  'flex min-h-11 w-full max-w-xs items-center justify-center rounded-full px-6 py-3 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-90'

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

function requireId(
  map: Map<string, string>,
  key: string,
  kind: string,
): string {
  const id = map.get(key)
  if (!id) throw new Error(`Missing ${kind}: ${key}`)
  return id
}

export default function SeedPage() {
  const schoolId = getSchoolId()
  const [busyAction, setBusyAction] = useState<'delete' | 'seed' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isBusy = busyAction !== null

  if (!schoolId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#000000] px-4 text-center">
        <p className="text-xl font-medium text-white">התחבר קודם</p>
      </div>
    )
  }

  async function handleDelete() {
    if (!schoolId) return
    const confirmed = window.confirm('למחוק את כל הנתונים הקיימים של בית הספר?')
    if (!confirmed) return

    setBusyAction('delete')
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = []
      let deletedCount = 0

      for (const name of DELETE_COLLECTIONS) {
        const snap = await getDocs(collection(db, 'schools', schoolId, name))
        for (const document of snap.docs) {
          writes.push((batch) => batch.delete(document.ref))
          deletedCount += 1
        }
      }

      await commitWrites(writes)
      setSuccessMessage(`נמחקו ${deletedCount} רשומות`)
    } catch (error) {
      console.error(error)
      setErrorMessage(WRITE_ERROR)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSeed() {
    if (!schoolId) return

    setBusyAction('seed')
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = []
      const busIdByLabel = new Map<string, string>()
      const classIdByName = new Map<string, string>()

      for (const label of BUS_LABELS) {
        const busRef = doc(collection(db, 'schools', schoolId, 'buses'))
        busIdByLabel.set(label, busRef.id)
        const bus: Bus = {
          id: busRef.id,
          school_id: schoolId,
          label,
          departed: false,
          departed_at: null,
        }
        writes.push((batch) => batch.set(busRef, bus))
      }

      for (const name of CLASS_NAMES) {
        const classRef = doc(collection(db, 'schools', schoolId, 'classes'))
        classIdByName.set(name, classRef.id)
        const schoolClass: SchoolClass = {
          id: classRef.id,
          school_id: schoolId,
          name,
        }
        writes.push((batch) => batch.set(classRef, schoolClass))
      }

      for (const student of STUDENTS) {
        const studentRef = doc(collection(db, 'schools', schoolId, 'students'))
        const busId = requireId(busIdByLabel, student.bus_label, 'bus')
        const classId = student.class_name
          ? requireId(classIdByName, student.class_name, 'class')
          : null
        const payload: Student = {
          id: studentRef.id,
          school_id: schoolId,
          first_name: student.first_name,
          last_name: student.last_name,
          class_id: classId,
          transport_mode: 'bus',
          arrival_bus_id: busId,
          departure_bus_id: busId,
          current_status: 'not_arrived',
          last_status_changed_at: null,
        }
        writes.push((batch) => batch.set(studentRef, payload))
      }

      await commitWrites(writes)
      setSuccessMessage(
        `נטענו ${BUS_LABELS.length} אוטובוסים, ${CLASS_NAMES.length} כיתות, ${STUDENTS.length} תלמידים`,
      )
    } catch (error) {
      console.error(error)
      setErrorMessage(WRITE_ERROR)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#000000] px-4 text-center">
      <h1 className="mb-3 text-2xl font-semibold text-white">
        טעינת נתוני בית הספר
      </h1>
      <p className="mb-8 max-w-sm text-[#98989d]">
        מחק קודם את הנתונים הקיימים, ואז טען את הרשימה.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy}
          className={`${BUTTON_CLASS} bg-[#B42318]`}
        >
          {busyAction === 'delete' ? <Spinner compact onDark /> : 'מחק נתונים קיימים'}
        </button>
        <button
          type="button"
          onClick={handleSeed}
          disabled={isBusy}
          className={`${BUTTON_CLASS} bg-[#3D90F0]`}
        >
          {busyAction === 'seed' ? <Spinner compact onDark /> : 'טען נתוני בית הספר'}
        </button>
      </div>
      {successMessage && (
        <p className="mt-6 text-[#278A3E]">{successMessage}</p>
      )}
      {errorMessage && <p className="mt-6 text-red-600">{errorMessage}</p>}
    </div>
  )
}
