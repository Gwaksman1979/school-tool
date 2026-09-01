const SCHOOL_ID_KEY = 'schoolId'

export function getSchoolId(): string | null {
  return localStorage.getItem(SCHOOL_ID_KEY)
}

export function setSchoolId(schoolId: string): void {
  localStorage.setItem(SCHOOL_ID_KEY, schoolId)
}

export function logout(): void {
  localStorage.removeItem(SCHOOL_ID_KEY)
  window.location.assign('/')
}
