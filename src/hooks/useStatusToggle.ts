import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { useCallback, useRef } from 'react'
import { db } from '../lib/firebase'
import { normalizeStatus, type Student } from '../types'

export function useStatusToggle(schoolId: string | null) {
  const inFlight = useRef(new Set<string>())

  const toggleStatus = useCallback(
    async (student: Student, busId?: string | null) => {
      if (!schoolId || inFlight.current.has(student.id)) return

      const current = normalizeStatus(student.current_status)
      const nextStatus: Student['current_status'] =
        current === 'at_school' ? 'left' : 'at_school'
      const direction = current === 'at_school' ? 'departure' : 'arrival'

      inFlight.current.add(student.id)

      try {
        const batch = writeBatch(db)
        const studentRef = doc(db, 'schools', schoolId, 'students', student.id)
        batch.update(studentRef, {
          current_status: nextStatus,
          last_status_changed_at: serverTimestamp(),
        })

        const eventRef = doc(
          collection(db, 'schools', schoolId, 'attendance_events'),
        )
        batch.set(eventRef, {
          id: eventRef.id,
          student_id: student.id,
          bus_id: busId ?? null,
          direction,
          timestamp: serverTimestamp(),
        })

        await batch.commit()
      } catch (error) {
        console.error('Failed to toggle student status', error)
        throw error
      } finally {
        inFlight.current.delete(student.id)
      }
    },
    [schoolId],
  )

  return toggleStatus
}
