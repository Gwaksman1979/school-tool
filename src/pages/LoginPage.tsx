import { collection, getDocs, query, where } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { setSchoolId } from '../lib/auth'
import { db } from '../lib/firebase'
import { CONNECTION_ERROR } from '../lib/messages'

export default function LoginPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const snapshot = await getDocs(
        query(collection(db, 'schools'), where('name', '==', name.trim())),
      )
      const match = snapshot.docs.find((docSnap) => docSnap.data().password === password)

      if (!match) {
        setError('\u05e9\u05dd \u05d1\u05d9\u05ea \u05d4\u05e1\u05e4\u05e8 \u05d0\u05d5 \u05d4\u05e1\u05d9\u05e1\u05de\u05d4 \u05e9\u05d2\u05d5\u05d9\u05d9\u05dd')
        return
      }

      setSchoolId(match.id)
      navigate('/bus')
    } catch (err) {
      console.error(err)
      setError(CONNECTION_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f3f4f6]">
      <header
        dir="ltr"
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center text-white"
        style={{
          backgroundColor: '#0d9488',
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <h1 className="text-lg font-semibold">School Tool</h1>
      </header>

      <div
        className="flex flex-1 items-center justify-center px-4"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}
      >
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <label className="mb-4 block text-right">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                \u05e9\u05dd \u05d1\u05d9\u05ea \u05d4\u05e1\u05e4\u05e8
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
                required
                disabled={isSubmitting}
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="mb-4 block text-right">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                \u05e1\u05d9\u05e1\u05de\u05d4
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            {error && (
              <p className="mb-4 text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0d9488] px-4 py-2.5 text-base font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-90"
            >
              {isSubmitting ? <Spinner compact onDark /> : '\u05db\u05e0\u05d9\u05e1\u05d4'}
            </button>
          </form>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          backgroundColor: '#0d9488',
          height: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      />
    </div>
  )
}
