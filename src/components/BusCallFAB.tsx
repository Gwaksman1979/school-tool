import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { useBuses } from '../hooks/useSchoolData'
import { getSchoolId } from '../lib/auth'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import type { Bus } from '../types'
import Modal from './Modal'

function MegaphoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.2-3.1" />
    </svg>
  )
}

export default function BusCallFAB({ isBus = false }: { isBus?: boolean }) {
  const schoolId = getSchoolId()
  const { items: buses } = useBuses(schoolId)
  const [open, setOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)

  const sortedBuses = useMemo(
    () =>
      [...buses].sort((a, b) =>
        a.label.localeCompare(b.label, 'he', { numeric: true }),
      ),
    [buses],
  )

  async function handleCall(bus: Bus) {
    if (!schoolId || isSending) return
    setIsSending(true)
    setCallError(null)
    try {
      const callRef = doc(collection(db, 'schools', schoolId, 'bus_calls'))
      await setDoc(callRef, {
        id: callRef.id,
        school_id: schoolId,
        bus_id: bus.id,
        triggered_at: serverTimestamp(),
      })
      setOpen(false)
    } catch (error) {
      console.error('Failed to trigger bus call', error)
      setCallError(WRITE_ERROR)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="קריאה לאוטובוס"
        className={[
          'app-fab flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg',
          isBus ? 'app-fab--with-pills' : '',
        ].join(' ')}
        style={{ backgroundColor: '#0d9488' }}
      >
        <MegaphoneIcon />
      </button>

      <Modal
        open={open}
        title="קריאה לאוטובוס"
        onClose={() => setOpen(false)}
      >
        {callError && (
          <p className="mb-3 text-center text-sm text-red-600" role="alert">
            {callError}
          </p>
        )}
        {sortedBuses.length === 0 ? (
          <p className="py-8 text-center text-gray-500">אין אוטובוסים</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-2">
            {sortedBuses.map((bus) => (
              <button
                key={bus.id}
                type="button"
                disabled={isSending}
                onClick={() => void handleCall(bus)}
                className="flex min-h-20 aspect-square items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-4xl font-bold text-gray-900 hover:border-teal-400 hover:bg-teal-50 disabled:opacity-60"
              >
                {bus.label}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
