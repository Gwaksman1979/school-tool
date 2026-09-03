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
    <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#0B0F1A] pt-[calc(32px+env(safe-area-inset-top,0px))] pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden">
        <SchoolLogo size={92} />
        <h1 className="mt-3 text-[38px] font-bold leading-none">
          <span className="text-white">School </span>
          <span className="text-[#3D90F0]">Tool</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-6 box-border w-full max-w-sm overflow-hidden px-6"
        >
          <label className="mb-3 block w-full">
            <span className="sr-only">שם בית הספר</span>
            <span className="flex h-[62px] w-full box-border items-center overflow-hidden rounded-[18px] bg-[#151A28] px-4">
              <PersonIcon className="h-6 w-6 shrink-0 text-[#3D90F0]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
                required
                disabled={isSubmitting}
                placeholder="שם בית הספר"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-white outline-none placeholder:text-[#7C7C81]"
              />
            </span>
          </label>
          <label className="mb-4 block w-full">
            <span className="sr-only">סיסמה</span>
            <span className="flex h-[62px] w-full box-border items-center overflow-hidden rounded-[18px] bg-[#151A28] px-4">
              <LockIcon className="h-6 w-6 shrink-0 text-[#3D90F0]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                placeholder="סיסמה"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-white outline-none placeholder:text-[#7C7C81]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                className="shrink-0 border-0 bg-transparent p-0 text-[#8494AD]"
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

        <div className="mt-6 box-border flex w-full max-w-sm items-center gap-3 px-6">
          <span className="h-px min-w-0 flex-1 bg-[#222A3A]" />
          <span className="shrink-0 text-sm text-[#8494AD]">או</span>
          <span className="h-px min-w-0 flex-1 bg-[#222A3A]" />
        </div>
        <button
          type="button"
          className="mt-3 border-0 bg-transparent p-0 text-sm font-medium text-[#5BA0FF]"
        >
          שכחת סיסמה?
        </button>
      </div>

      <p className="shrink-0 px-4 text-center text-[10px] text-white/30">
        © 2026 All rights reserved to Communit Inclusive Innovation Ltd.
      </p>
    </div>
  )
}
