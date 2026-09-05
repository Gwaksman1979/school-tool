import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroGlow from '../components/HeroGlow'
import SchoolLogo from '../components/SchoolLogo'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/bus', { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="relative z-[1] flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-transparent pl-0">
      <HeroGlow />
      <SchoolLogo size={112} animated />
      <h1 className="text-[38px] font-bold leading-none">
        <span className="text-white">School </span>
        <span className="text-[#3D90F0]">Tool</span>
      </h1>
      <svg viewBox="0 0 34 34" width="34" height="34" className="splash-spinner" aria-hidden="true">
        <circle
          cx="17"
          cy="17"
          r="13"
          fill="none"
          stroke="#3D90F0"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 22"
        />
      </svg>
    </div>
  )
}
