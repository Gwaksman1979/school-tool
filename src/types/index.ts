import type { Timestamp } from 'firebase/firestore'

export interface School {
  id: string
  name: string
  password: string
}

export interface SchoolClass {
  id: string
  school_id: string
  name: string
}

export interface Bus {
  id: string
  school_id: string
  label: string
  departed?: boolean
  departed_at?: Timestamp | null
}

export interface Student {
  id: string
  school_id: string
  first_name: string
  last_name: string
  class_id: string | null
  transport_mode: 'bus' | 'independent' | 'family'
  arrival_bus_id: string | null
  departure_bus_id: string | null
  current_status: 'at_school' | 'left' | 'not_arrived'
  last_status_changed_at: Timestamp | null
}

export interface Remark {
  id: string
  student_id: string
  date: string
  text: string
  created_at: Timestamp
}

export interface BusCall {
  id: string
  school_id: string
  bus_id: string
  triggered_at: Timestamp
}

export function isBusDeparted(bus: Bus | null | undefined): boolean {
  return Boolean(bus?.departed)
}

export function sortBuses(buses: Bus[]): Bus[] {
  return [...buses].sort((a, b) =>
    a.label.localeCompare(b.label, 'he', { numeric: true }),
  )
}

export function normalizeStatus(
  status: Student['current_status'] | string,
): Student['current_status'] {
  if (status === 'at_school' || status === 'left') return status
  return 'not_arrived'
}

export interface AttendanceEvent {
  id: string
  student_id: string
  bus_id: string | null
  direction: 'arrival' | 'departure'
  timestamp: Timestamp
}
