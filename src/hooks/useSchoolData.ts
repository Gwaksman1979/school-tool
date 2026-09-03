import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Bus, SchoolClass, Student } from '../types'

export interface CollectionState<T> {
  items: T[]
  isLoading: boolean
  error: boolean
}

function useSchoolSubcollection<T>(
  schoolId: string | null,
  subcollection: string,
): CollectionState<T> {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(schoolId))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!schoolId) {
      setItems([])
      setIsLoading(false)
      setError(false)
      return
    }

    setError(false)

    const unsubscribe = onSnapshot(
      collection(db, 'schools', schoolId, subcollection),
      (snapshot) => {
        setItems(
          snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as Omit<T, 'id'>),
            id: docSnap.id,
          })) as T[],
        )
        setIsLoading(false)
        setError(false)
      },
      (listenError) => {
        console.error(`Failed to listen to ${subcollection}`, listenError)
        setIsLoading(false)
        setError(true)
      },
    )

    return unsubscribe
  }, [schoolId, subcollection])

  return { items, isLoading, error }
}

export function useBuses(schoolId: string | null): CollectionState<Bus> {
  return useSchoolSubcollection<Bus>(schoolId, 'buses')
}

export function useStudents(schoolId: string | null): CollectionState<Student> {
  return useSchoolSubcollection<Student>(schoolId, 'students')
}

export function useClasses(schoolId: string | null): CollectionState<SchoolClass> {
  return useSchoolSubcollection<SchoolClass>(schoolId, 'classes')
}

export function useSchoolCollections(schoolId: string | null) {
  const buses = useBuses(schoolId)
  const students = useStudents(schoolId)
  const classes = useClasses(schoolId)
  return {
    buses: buses.items,
    students: students.items,
    classes: classes.items,
    isLoading: buses.isLoading || students.isLoading || classes.isLoading,
    error: buses.error || students.error || classes.error,
  }
}
