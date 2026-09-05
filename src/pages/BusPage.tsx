import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BusCarousel from '../components/BusCarousel'
import InlineSearch from '../components/InlineSearch'
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
import { isBusDeparted, normalizeStatus, sortBuses } from '../types'

export default function BusPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const { setChrome } = useBusChrome()
  const [selectedBusId, setSelectedBusId] = useState('')
  const [search, setSearch] = useState('')
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
  const filteredBuses = useMemo(() => {
    const query = search.trim()
    return sortedBuses.filter((bus) => !query || bus.label.includes(query))
  }, [sortedBuses, search])
  const chromeKeyRef = useRef('')

  useEffect(() => {
    if (!selectedBusId && sortedBuses[0]) {
      setSelectedBusId(sortedBuses[0].id)
    }
  }, [selectedBusId, sortedBuses])

  useEffect(() => {
    if (search.trim() && filteredBuses.length === 1) {
      handleSelectBus(filteredBuses[0].id)
    }
  }, [search, filteredBuses, handleSelectBus])

  const classNameById = useMemo(
    () => Object.fromEntries(classes.map((schoolClass) => [schoolClass.id, schoolClass.name])),
    [classes],
  )

  const selectedBus = sortedBuses.find((bus) => bus.id === selectedBusId) ?? null
  const departed = isBusDeparted(selectedBus)
  const atSchoolCount = students.filter(
    (s) => normalizeStatus(s.current_status) === 'at_school',
  ).length

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
      <div className="shrink-0">
        <div
          className="flex items-center justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', paddingBottom: 4 }}
        >
          <h2 className="text-[17px] font-normal text-[#98989d] m-0">הסעות</h2>
          <div className="flex items-center gap-2 me-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4c542" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span style={{ color: '#f4c542', fontSize: 17, fontWeight: 700 }}>{atSchoolCount}</span>
          </div>
        </div>
        <div style={{ marginTop: 'calc(2rem - 4mm)' }}>
          <BusCarousel
            buses={filteredBuses}
            students={students}
            selectedBusId={selectedBusId}
            onSelect={handleSelectBus}
          />
        </div>
        <div className="mt-3">
          <InlineSearch
            value={search}
            onChange={setSearch}
            placeholder="חיפוש קו..."
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      <PageSheet>
        {error ? (
          <ConnectionError />
        ) : isLoading ? (
          <Spinner />
        ) : !selectedBusId ? (
          <p className="py-12 text-center text-[#98989d]">
            בחר אוטובוס כדי לראות תלמידים
          </p>
        ) : (
          <>
            <h2 className="mb-2 text-center text-[17px] font-medium text-[#98989d]">
              סה״כ {visibleStudents.length} תלמידים
            </h2>
            {visibleStudents.length === 0 ? (
              <p className="py-12 text-center text-[#98989d]">
                אין תלמידים משויכים לאוטובוס זה
              </p>
            ) : (
              <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
                {visibleStudents.map((student) => (
                  <li key={student.id} className="list-none">
                    <StudentCard
                      student={student}
                      busLabel={selectedBus?.label ?? null}
                      className={
                        student.class_id
                          ? (classNameById[student.class_id] ?? null)
                          : null
                      }
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
                className="mx-auto mt-3 block border-0 bg-transparent p-0 text-center text-base font-medium text-[#0071e3] disabled:opacity-50"
              >
                {isResetting ? <Spinner compact /> : 'אפס הסעה'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isDeparting}
                onClick={() => void handleDeparted()}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-4 text-base font-semibold text-white shadow-[0_8px_28px_rgba(59,139,255,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
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
