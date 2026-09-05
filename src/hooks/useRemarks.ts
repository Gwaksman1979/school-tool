import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Remark } from '../types'

export function todayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useRemarks(
  schoolId: string | null,
  studentId: string | null,
): Remark[] {
  const [remarks, setRemarks] = useState<Remark[]>([])

  useEffect(() => {
    if (!schoolId || !studentId) {
      setRemarks([])
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, 'schools', schoolId, 'students', studentId, 'remarks'),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<Remark, 'id'>),
          id: docSnap.id,
        }))
        items.sort((a, b) => {
          const aTime = a.created_at?.toMillis?.() ?? 0
          const bTime = b.created_at?.toMillis?.() ?? 0
          return bTime - aTime
        })
        setRemarks(items)
      },
      (error) => {
        console.error('Failed to listen to remarks', error)
      },
    )

    return unsubscribe
  }, [schoolId, studentId])

  return remarks
}

export async function addRemark(
  schoolId: string,
  studentId: string,
  date: string,
  text: string,
  targetDate?: string | null,
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  const remarkRef = doc(
    collection(db, 'schools', schoolId, 'students', studentId, 'remarks'),
  )
  const data: Record<string, unknown> = {
    id: remarkRef.id,
    student_id: studentId,
    date,
    text: trimmed,
    created_at: serverTimestamp(),
  }
  if (targetDate) data.target_date = targetDate
  await setDoc(remarkRef, data)
}

export async function deleteRemark(
  schoolId: string,
  studentId: string,
  remarkId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, 'schools', schoolId, 'students', studentId, 'remarks', remarkId),
  )
}
