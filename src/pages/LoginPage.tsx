import { collection, getDocs, query, where } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SchoolLogo from '../components/SchoolLogo'
import Spinner from '../components/Spinner'
import { EyeIcon, EyeOffIcon, LockIcon, PersonIcon } from '../components/icons'
import { setSchoolId } from '../lib/auth'
import { db } from '../lib/firebase'
import { CONNECTION_ERROR } from '../lib/messages'

export default function LoginPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        setError('שם בית הספר או הסיסמה שגויים')
        return
      }

      setSchoolId(match.id)
      navigate('/splash')
    } catch (err) {
      console.error(err)
      setError(CONNECTION_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0B0F1A] px-6 pt-[calc(48px+env(safe-area-inset-top,0px))] pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <div className="flex flex-1 flex-col items-center justify-center">
        <SchoolLogo size={92} />
        <h1 className="mt-4 text-[38px] font-bold leading-none">
          <span className="text-white">School</span>
          <span className="text-[#3D90F0]">Tool</span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm">
          <label className="mb-3 block">
            <span className="sr-only">שם בית הספר</span>
            <span className="relative block">
              <span className="pointer-events-none absolute top-1/2 start-4 -translate-y-1/2 text-[#3D90F0]">
                <PersonIcon className="h-6 w-6" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
                required
                disabled={isSubmitting}
                placeholder="שם בית הספר"
                className="h-[62px] w-full rounded-[18px] border-0 bg-[#151A28] ps-14 pe-4 text-base text-white outline-none placeholder:text-[#7C7C81]"
              />
            </span>
          </label>
          <label className="mb-4 block">
            <span className="sr-only">סיסמה</span>
            <span className="relative block">
              <span className="pointer-events-none absolute top-1/2 start-4 -translate-y-1/2 text-[#3D90F0]">
                <LockIcon className="h-6 w-6" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                placeholder="סיסמה"
                className="h-[62px] w-full rounded-[18px] border-0 bg-[#151A28] ps-14 pe-14 text-base text-white outline-none placeholder:text-[#7C7C81]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                className="absolute top-1/2 end-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#8494AD]"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </span>
          </label>
          {error && (
            <p className="mb-4 text-center text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-[58px] w-full items-center justify-center rounded-full bg-[#3D90F0] text-base font-bold text-white shadow-[0_8px_28px_rgba(77,163,255,0.30)] disabled:cursor-not-allowed disabled:opacity-90"
          >
            {isSubmitting ? <Spinner compact onDark /> : 'התחבר'}
          </button>
        </form>

        <div className="mt-8 flex w-full max-w-sm items-center gap-3">
          <span className="h-px flex-1 bg-[#222A3A]" />
          <span className="text-sm text-[#8494AD]">או</span>
          <span className="h-px flex-1 bg-[#222A3A]" />
        </div>
        <button type="button" className="mt-4 text-sm font-medium text-[#5BA0FF]">
          שכחת סיסמה?
        </button>
      </div>

      <p className="text-center text-[10px] text-white/30">
        © 2026 All rights reserved to Communit Inclusive Innovation Ltd.
      </p>
    </div>
  )
}
