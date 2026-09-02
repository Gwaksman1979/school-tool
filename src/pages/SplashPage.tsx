import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/bus', { replace: true })
    }, 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#f0fdfa' }}
    >
      <div className="splash-wheel">
        <svg viewBox="0 0 100 100" className="h-32 w-32">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#0d9488" strokeWidth="5" opacity="0.2" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#0d9488"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="69 208"
          />
          <circle cx="50" cy="50" r="10" fill="none" stroke="#0d9488" strokeWidth="4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="50"
              x2={50 + 34 * Math.cos((angle * Math.PI) / 180)}
              y2={50 + 34 * Math.sin((angle * Math.PI) / 180)}
              stroke="#0d9488"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
      <p className="text-xl font-bold" style={{ color: '#0d9488' }}>
        School Tool
      </p>
    </div>
  )
}
