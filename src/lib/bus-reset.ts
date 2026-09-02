import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const TIME_ZONE = 'Asia/Jerusalem'
const AFTERNOON_RESET_HOUR = 13

function jerusalemParts(now: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  }
}

function jerusalemWallTimeToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  function offsetMs(instant: Date): number {
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((part) => [part.type, part.value]),
    )
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    return asUtc - instant.getTime()
  }

  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, 0, 0)
  const first = new Date(desiredAsUtc - offsetMs(new Date(desiredAsUtc)))
  return new Date(desiredAsUtc - offsetMs(first))
}

function currentWindowResetAt(now = new Date()): Date {
  const { year, month, day, hour } = jerusalemParts(now)
  const resetHour = hour < AFTERNOON_RESET_HOUR ? 0 : AFTERNOON_RESET_HOUR
  return jerusalemWallTimeToDate(year, month, day, resetHour)
}

export async function checkAndResetBuses(schoolId: string): Promise<void> {
  if (!schoolId) return

  try {
    const windowStart = currentWindowResetAt()
    const metaRef = doc(db, 'schools', schoolId, 'meta', 'bus_reset')
    const metaSnap = await getDoc(metaRef)
    const lastReset = metaSnap.data()?.last_reset as Timestamp | undefined

    if (lastReset && lastReset.toMillis() >= windowStart.getTime()) {
      return
    }

    const busesSnap = await getDocs(collection(db, 'schools', schoolId, 'buses'))
    const batch = writeBatch(db)

    for (const busDoc of busesSnap.docs) {
      batch.update(busDoc.ref, {
        departed: false,
        departed_at: null,
      })
    }

    batch.set(metaRef, { last_reset: serverTimestamp() })
    await batch.commit()
  } catch (error) {
    console.error('Failed to reset bus departed flags', error)
  }
}
