import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useState } from 'react'
import Spinner from '../components/Spinner'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import type { Bus, School, SchoolClass, Student } from '../types'

const SCHOOL_NAME = 'גיל'
const SCHOOL_PASSWORD = '1234'
const CLASS_NAMES = ['א1', 'א2', 'ב1'] as const
const BUS_LABELS = ['1', '2', '3', '4'] as const

type SeedStudent = Omit<
  Student,
  'id' | 'school_id' | 'class_id' | 'arrival_bus_id' | 'departure_bus_id'
> & {
  classIndex: number
  arrivalBusIndex: number | null
  departureBusIndex: number | null
}

const STUDENTS: SeedStudent[] = [
  {
    first_name: 'דניאל',
    last_name: 'כהן',
    classIndex: 0,
    transport_mode: 'bus',
    arrivalBusIndex: 0,
    departureBusIndex: 0,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'נועה',
    last_name: 'לוי',
    classIndex: 0,
    transport_mode: 'bus',
    arrivalBusIndex: 0,
    departureBusIndex: 0,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'יונתן',
    last_name: 'מזרחי',
    classIndex: 0,
    transport_mode: 'bus',
    arrivalBusIndex: 1,
    departureBusIndex: 1,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'שירה',
    last_name: 'אברהם',
    classIndex: 0,
    transport_mode: 'independent',
    arrivalBusIndex: null,
    departureBusIndex: null,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'עומר',
    last_name: 'דוד',
    classIndex: 1,
    transport_mode: 'bus',
    arrivalBusIndex: 1,
    departureBusIndex: 1,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'מאיה',
    last_name: 'פרץ',
    classIndex: 1,
    transport_mode: 'bus',
    arrivalBusIndex: 2,
    departureBusIndex: 2,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'איתי',
    last_name: 'גולן',
    classIndex: 1,
    transport_mode: 'bus',
    arrivalBusIndex: 2,
    departureBusIndex: 2,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'ליאור',
    last_name: 'רוזנברג',
    classIndex: 1,
    transport_mode: 'family',
    arrivalBusIndex: null,
    departureBusIndex: null,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'תמר',
    last_name: 'בן דוד',
    classIndex: 2,
    transport_mode: 'bus',
    arrivalBusIndex: 3,
    departureBusIndex: 3,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'אדם',
    last_name: 'שלום',
    classIndex: 2,
    transport_mode: 'bus',
    arrivalBusIndex: 3,
    departureBusIndex: 3,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'רוני',
    last_name: 'חיים',
    classIndex: 2,
    transport_mode: 'bus',
    arrivalBusIndex: 0,
    departureBusIndex: 1,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
  {
    first_name: 'הילה',
    last_name: 'מלכה',
    classIndex: 2,
    transport_mode: 'bus',
    arrivalBusIndex: 2,
    departureBusIndex: 3,
    current_status: 'not_arrived',
    last_status_changed_at: null,
  },
]

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSeed() {
    setIsSeeding(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const existing = await getDocs(
        query(collection(db, 'schools'), where('name', '==', SCHOOL_NAME)),
      )

      if (!existing.empty) {
        window.alert('נתוני הבדיקה כבר קיימים')
        return
      }

      const batch = writeBatch(db)
      const schoolRef = doc(collection(db, 'schools'))
      const school: School = {
        id: schoolRef.id,
        name: SCHOOL_NAME,
        password: SCHOOL_PASSWORD,
      }
      batch.set(schoolRef, school)

      const classRefs = CLASS_NAMES.map((name) => {
        const classRef = doc(collection(db, 'schools', schoolRef.id, 'classes'))
        const schoolClass: SchoolClass = {
          id: classRef.id,
          school_id: schoolRef.id,
          name,
        }
        batch.set(classRef, schoolClass)
        return classRef
      })

      const busRefs = BUS_LABELS.map((label) => {
        const busRef = doc(collection(db, 'schools', schoolRef.id, 'buses'))
        const bus: Bus = {
          id: busRef.id,
          school_id: schoolRef.id,
          label,
          departed: false,
          departed_at: null,
        }
        batch.set(busRef, bus)
        return busRef
      })

      for (const student of STUDENTS) {
        const studentRef = doc(
          collection(db, 'schools', schoolRef.id, 'students'),
        )
        const payload: Student = {
          id: studentRef.id,
          school_id: schoolRef.id,
          first_name: student.first_name,
          last_name: student.last_name,
          class_id: classRefs[student.classIndex].id,
          transport_mode: student.transport_mode,
          arrival_bus_id:
            student.arrivalBusIndex === null
              ? null
              : busRefs[student.arrivalBusIndex].id,
          departure_bus_id:
            student.departureBusIndex === null
              ? null
              : busRefs[student.departureBusIndex].id,
          current_status: student.current_status,
          last_status_changed_at: student.last_status_changed_at,
        }
        batch.set(studentRef, payload)
      }

      await batch.commit()

      const message = `הנתונים נטענו בהצלחה. מזהה בית הספר: ${schoolRef.id}`
      console.log('Seeded school ID:', schoolRef.id)
      setSuccessMessage(message)
    } catch (error) {
      console.error(error)
      setErrorMessage(WRITE_ERROR)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f4f6] px-4 text-center">
      <h1 className="mb-6 text-2xl font-semibold">טעינת נתוני בדיקה</h1>
      <button
        type="button"
        onClick={handleSeed}
        disabled={isSeeding}
        className="flex min-h-11 items-center justify-center rounded-lg bg-[#0d9488] px-6 py-3 text-lg font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-90"
      >
        {isSeeding ? <Spinner compact onDark /> : 'טען נתוני בדיקה'}
      </button>
      {successMessage && (
        <p className="mt-6 text-green-700">{successMessage}</p>
      )}
      {errorMessage && <p className="mt-6 text-red-600">{errorMessage}</p>}
    </div>
  )
}
