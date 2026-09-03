import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BusCarousel from '../components/BusCarousel'
import PageSheet from '../components/PageSheet'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { BusIcon } from '../components/icons'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { useBusChrome } from '../lib/bus-chrome'
import { db } from '../lib/firebase'
import { WRITE_ERROR } from '../lib/messages'
import { usePageTitle } from '../lib/page-title'
import { isBusDeparted, sortBuses } from '../types'

export default function BusPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const { setChrome } = useBusChrome()
  const [selectedBusId, setSelectedBusId] = useState('')
  const [isDeparting, setIsDeparting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [departError, setDepartError] = useState<string | null>(null)

  const handleSelectBus = useCallback((busId: string) => {
    setSelectedBusId((current) => {
      if (busId === current) return current
      navigator.vibrate?.(10)
      return busId
    })
  }, [])

  const sortedBuses = useMemo(() => sortBuses(buses), [buses])
  const chromeKeyRef = useRef('')

  useEffect(() => {
    if (!selectedBusId && sortedBuses[0]) {
      setSelectedBusId(sortedBuses[0].id)
    }
  }, [selectedBusId, sortedBuses])

  const classNameById = useMemo(
    () => Object.fromEntries(classes.map((schoolClass) => [schoolClass.id, schoolClass.name])),
    [classes],
  )

  const selectedBus = sortedBuses.find((bus) => bus.id === selectedBusId) ?? null
  const departed = isBusDeparted(selectedBus)

  useEffect(() => {
    setTitle(
      selectedBus
        ? departed
          ? `יצאה · קו ${selectedBus.label}`
          : `קו ${selectedBus.label}`
        : 'אוטובוס',
    )
  }, [selectedBus, departed, setTitle])

  const dropdownItems = useMemo(
    () =>
      sortedBuses.map((bus) => ({
        id: bus.id,
        label: `קו ${bus.label}`,
        muted: isBusDeparted(bus),
      })),
    [sortedBuses],
  )

  useEffect(() => {
    const key = JSON.stringify({
      dropdownItems,
      selectedId: selectedBusId,
      departed,
    })
    if (chromeKeyRef.current === key) return
    chromeKeyRef.current = key
    setChrome({
      dropdownItems,
      selectedId: selectedBusId,
      onDropdownSelect: handleSelectBus,
      departed,
    })
  }, [dropdownItems, selectedBusId, departed, setChrome, handleSelectBus])

  useEffect(() => {
    return () => setChrome(null)
  }, [setChrome])

  const visibleStudents = useMemo(() => {
    if (!selectedBusId) return []
    return students
      .filter(
        (student) =>
          student.transport_mode === 'bus' &&
          (student.arrival_bus_id === selectedBusId ||
            student.departure_bus_id === selectedBusId),
      )
      .sort((a, b) => a.first_name.localeCompare(b.first_name, 'he'))
  }, [students, selectedBusId])

  async function handleDeparted() {
    if (!schoolId || !selectedBusId || departed || isDeparting) return
    setIsDeparting(true)
    setDepartError(null)
    try {
      await updateDoc(doc(db, 'schools', schoolId, 'buses', selectedBusId), {
        departed: true,
        departed_at: serverTimestamp(),
      })
    } catch (writeError) {
      console.error('Failed to mark bus departed', writeError)
      setDepartError(WRITE_ERROR)
    } finally {
      setIsDeparting(false)
    }
  }

  async function handleResetDeparted() {
    if (!schoolId || !selectedBusId || !departed || isResetting) return
    setIsResetting(true)
    setDepartError(null)
    try {
      await updateDoc(doc(db, 'schools', schoolId, 'buses', selectedBusId), {
        departed: false,
        departed_at: null,
      })
    } catch (writeError) {
      console.error('Failed to reset bus departed', writeError)
      setDepartError(WRITE_ERROR)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 bg-[#0B0F1A]">
        <BusCarousel
          buses={buses}
          students={students}
          selectedBusId={selectedBusId}
          onSelect={handleSelectBus}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      <PageSheet>
        {error ? (
          <ConnectionError />
        ) : isLoading ? (
          <Spinner />
        ) : !selectedBusId ? (
          <p className="py-12 text-center text-[#8494AD]">
            בחר אוטובוס כדי לראות תלמידים
          </p>
        ) : (
          <>
            <h2 className="mb-2 text-center text-[17px] font-medium text-white">
              סה״כ {visibleStudents.length} תלמידים
            </h2>
            {visibleStudents.length === 0 ? (
              <p className="py-12 text-center text-[#8494AD]">
                אין תלמידים משויכים לאוטובוס זה
              </p>
            ) : (
              <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
                {visibleStudents.map((student) => (
                  <li key={student.id} className="list-none">
                    <StudentCard
                      student={student}
                      busLabel={selectedBus?.label ?? null}
                      className={classNameById[student.class_id] ?? null}
                      onStatusToggle={(current) => toggleStatus(current, selectedBusId)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {departed && (
              <div className="mt-4 flex min-h-10 items-center justify-center rounded-full bg-[#261806] px-4 text-sm font-semibold text-[#FFB27A]">
                ההסעה יצאה
              </div>
            )}
            {departed ? (
              <button
                type="button"
                disabled={isResetting}
                onClick={() => void handleResetDeparted()}
                className="mx-auto mt-3 block border-0 bg-transparent p-0 text-center text-base font-medium text-[#3D90F0] disabled:opacity-50"
              >
                {isResetting ? <Spinner compact /> : 'אפס הסעה'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isDeparting}
                onClick={() => void handleDeparted()}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3580E0] px-4 text-base font-semibold text-white shadow-[0_8px_28px_rgba(59,139,255,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeparting ? (
                  <Spinner compact onDark />
                ) : (
                  <>
                    <BusIcon className="h-5 w-5" />
                    <span>ההסעה יצאה</span>
                  </>
                )}
              </button>
            )}
            {departError && (
              <p className="mt-2 text-center text-sm text-red-400" role="alert">
                {departError}
              </p>
            )}
          </>
        )}
      </PageSheet>
      </div>
    </div>
  )
}
