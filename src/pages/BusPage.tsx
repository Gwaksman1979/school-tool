import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import BusPills from '../components/BusPills'
import PageSheet from '../components/PageSheet'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
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
  const [departError, setDepartError] = useState<string | null>(null)

  const sortedBuses = useMemo(() => sortBuses(buses), [buses])

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
          ? 'הסעה יצאה'
          : `קו ${selectedBus.label}`
        : 'אוטובוס',
    )
  }, [selectedBus, departed, setTitle])

  useEffect(() => {
    setChrome({
      buses: sortedBuses,
      selectedBusId,
      departed,
      onSelectBus: setSelectedBusId,
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

  return (
    <>
      <PageSheet>
        {error ? (
          <ConnectionError />
        ) : isLoading ? (
          <Spinner />
        ) : !selectedBusId ? (
          <p className="py-12 text-center text-gray-500">
            בחר אוטובוס כדי לראות תלמידים
          </p>
        ) : (
          <>
            {visibleStudents.length === 0 ? (
              <p className="py-12 text-center text-gray-500">
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
            <button
              type="button"
              disabled={departed || isDeparting}
              onClick={() => void handleDeparted()}
              className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0d9488] px-4 text-base font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isDeparting ? <Spinner compact onDark /> : 'הסעה יצאה'}
            </button>
            {departError && (
              <p className="mt-2 text-center text-sm text-red-600" role="alert">
                {departError}
              </p>
            )}
          </>
        )}
      </PageSheet>
      <BusPills
        buses={buses}
        students={students}
        selectedBusId={selectedBusId}
        onSelect={setSelectedBusId}
      />
    </>
  )
}
