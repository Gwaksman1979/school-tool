import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useBuses } from '../hooks/useSchoolData'
import { getSchoolId } from './auth'
import { db } from './firebase'
import type { BusCall } from '../types'

const FRESH_WINDOW_MS = 30_000
const AUTO_DISMISS_MS = 10_000

interface BusCallContextValue {
  isVisible: boolean
  busLabel: string | null
  dismiss: () => void
}

const BusCallContext = createContext<BusCallContextValue>({
  isVisible: false,
  busLabel: null,
  dismiss: () => {},
})

function isFreshCall(call: BusCall): boolean {
  const triggeredAt = call.triggered_at?.toMillis?.()
  if (!triggeredAt) return false
  return Date.now() - triggeredAt <= FRESH_WINDOW_MS
}

export function BusCallProvider({ children }: { children: ReactNode }) {
  const schoolId = getSchoolId()
  const { items: buses } = useBuses(schoolId)
  const [latestCall, setLatestCall] = useState<BusCall | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  useEffect(() => {
    if (!schoolId) return

    const callsQuery = query(
      collection(db, 'schools', schoolId, 'bus_calls'),
      orderBy('triggered_at', 'desc'),
      limit(1),
    )

    const unsubscribe = onSnapshot(
      callsQuery,
      (snapshot) => {
        const docSnap = snapshot.docs[0]
        if (!docSnap) {
          setLatestCall(null)
          return
        }
        setLatestCall({
          ...(docSnap.data() as Omit<BusCall, 'id'>),
          id: docSnap.id,
        })
      },
      (error) => {
        console.error('Failed to listen to bus calls', error)
      },
    )

    return unsubscribe
  }, [schoolId])

  const visibleCall =
    latestCall && isFreshCall(latestCall) && latestCall.id !== dismissedId
      ? latestCall
      : null

  useEffect(() => {
    if (!visibleCall) return
    const timeoutId = window.setTimeout(() => {
      setDismissedId(visibleCall.id)
    }, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timeoutId)
  }, [visibleCall])

  const busLabel = useMemo(() => {
    if (!visibleCall) return null
    return buses.find((bus) => bus.id === visibleCall.bus_id)?.label ?? null
  }, [buses, visibleCall])

  const value = useMemo(
    () => ({
      isVisible: Boolean(visibleCall),
      busLabel,
      dismiss: () => {
        if (visibleCall) setDismissedId(visibleCall.id)
      },
    }),
    [visibleCall, busLabel],
  )

  return <BusCallContext.Provider value={value}>{children}</BusCallContext.Provider>
}

export function useBusCall() {
  return useContext(BusCallContext)
}
