import { useEffect, useMemo, useState } from 'react'
import BusPills from '../components/BusPills'
import PageSheet from '../components/PageSheet'
import Spinner, { ConnectionError } from '../components/Spinner'
import StudentCard from '../components/StudentCard'
import { useSchoolCollections } from '../hooks/useSchoolData'
import { useStatusToggle } from '../hooks/useStatusToggle'
import { getSchoolId } from '../lib/auth'
import { usePageTitle } from '../lib/page-title'

export default function BusPage() {
  const schoolId = getSchoolId()
  const { buses, students, classes, isLoading, error } = useSchoolCollections(schoolId)
  const toggleStatus = useStatusToggle(schoolId)
  const { setTitle } = usePageTitle()
  const [selectedBusId, setSelectedBusId] = useState('')

  const sortedBuses = useMemo(
    () =>
      [...buses].sort((a, b) =>
        a.label.localeCompare(b.label, 'he', { numeric: true }),
      ),
    [buses],
  )

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

  useEffect(() => {
    setTitle(selectedBus ? `קו ${selectedBus.label}` : 'אוטובוס')
  }, [selectedBus, setTitle])

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
        ) : visibleStudents.length === 0 ? (
          <p className="py-12 text-center text-gray-500">
            אין תלמידים משויכים לאוטובוס זה
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-2 overflow-hidden p-0">
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
