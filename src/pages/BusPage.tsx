import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import BusCarousel from '../components/BusCarousel'
import PageSheet from '../components/PageSheet'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { BusIcon } from '../components/icons'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { useBusChrome } from '../lib/bus-chrome'
import { checkAndResetBuses } from '../lib/bus-reset'
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

  const sortedBuses = useMemo(() => sortBuses(buses), [buses])

  useEffect(() => {
    if (!schoolId) return
    void checkAndResetBuses(schoolId)
  }, [schoolId])

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

  useEffect(() => {
    setChrome({
      dropdownItems: sortedBuses.map((bus) => ({
        id: bus.id,
        label: `קו ${bus.label}`,
        muted: isBusDeparted(bus),
      })),
      selectedId: selectedBusId,
      onDropdownSelect: setSelectedBusId,
      departed,
    })
  }, [sortedBuses, selectedBusId, departed, setChrome])

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
    <>
      <BusCarousel
        buses={buses}
        students={students}
        selectedBusId={selectedBusId}
        onSelect={setSelectedBusId}
      />
      <div className="flex justify-center pb-2">
        <span className="h-2 w-2 rounded-full bg-[#E06818]" />
      </div>
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
            <h2 className="mb-3 text-center text-[17px] font-medium text-white">
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
                className="mx-auto mt-3 flex min-h-11 items-center justify-center rounded-full bg-[#1A2030] px-6 text-base font-medium text-white disabled:opacity-50"
              >
                {isResetting ? <Spinner compact onDark /> : 'אפס הסעה'}
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
            {departed && (
              <p className="mt-3 text-center text-sm font-medium text-[#E06818]">
                ההסעה יצאה
              </p>
            )}
            {departError && (
              <p className="mt-2 text-center text-sm text-red-400" role="alert">
                {departError}
              </p>
            )}
          </>
        )}
      </PageSheet>
    </>
  )
}
