import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SPLASH_DURATION = 4000

// Logo SVG paths traced from the School Tool logo (two figures embracing)
// Each path draws in sequence using stroke-dashoffset animation
const PATHS = [
  'M59.9,9.9 L35.0,29.2 L32.1,30.1 L30.3,29.5 L28.4,23.7 L25.0,25.8 L19.6,34.2 L14.4,46.4 L12.4,59.4 L13.4,69.9 L16.1,75.0 L20.0,78.7 L27.9,81.9 L22.7,74.7 L20.7,69.7 L20.7,62.8 L22.0,61.0 L23.8,60.7 L27.1,64.0 L34.6,78.4 L39.8,84.2 L49.6,90.5 L57.4,92.2 L68.0,91.4 L74.5,88.9 L80.9,83.4 L83.5,78.2 L73.5,83.8 L62.4,83.8 L53.4,78.9 L49.0,73.9 L45.6,67.0 L43.9,57.7 L45.4,42.6 L49.1,31.5 Z',
  'M55.7,27.5 L50.2,36.3 L46.6,46.8 L46.2,50.8 L46.4,62.4 L48.5,70.1 L50.4,73.7 L53.5,76.9 L57.3,79.9 L60.4,81.4 L66.8,82.8 L72.4,82.7 L76.1,81.7 L76.3,81.1 L68.6,81.3 L64.9,80.2 L60.7,76.9 L57.8,72.8 L57.5,63.8 L58.9,59.9 L63.8,53.0 L74.8,42.6 L66.2,44.5 L60.3,44.5 L58.2,43.6 L55.6,40.9 L54.9,38.9 Z',
  'M72.1,51.9 L69.2,53.3 L64.9,56.9 L61.1,61.0 L60.3,62.4 L59.6,64.3 L59.5,71.5 L59.6,72.5 L60.7,74.9 L61.9,76.7 L63.9,78.5 L66.4,79.7 L68.6,80.2 L70.0,80.2 L70.0,80.0 L67.9,77.6 L67.4,76.7 L67.4,75.9 L67.6,75.4 L69.6,73.3 L70.8,72.5 L73.2,71.4 L81.2,69.1 L80.6,68.6 L77.1,67.5 L74.3,66.2 L72.5,64.9 L71.2,63.0 L70.9,62.0 L71.0,58.2 L72.1,53.2 Z',
  'M44.1,7.5 L42.3,6.9 L40.7,6.9 L38.0,6.9 L36.3,7.4 L33.7,9.0 L32.0,10.7 L30.8,12.7 L30.1,14.4 L30.0,15.3 L30.0,17.7 L30.5,20.0 L31.5,22.1 L32.6,23.4 L33.8,24.6 L35.4,25.8 L35.9,25.9 L36.6,25.8 L38.4,24.6 L46.4,17.6 L49.8,14.1 L49.8,13.5 L49.5,12.8 L47.4,9.9 L46.0,8.6 Z',
  'M62.0,30.2 L61.1,30.5 L59.9,31.3 L58.6,32.5 L57.9,33.4 L57.4,35.3 L57.4,37.6 L57.7,38.4 L58.4,39.8 L59.1,40.6 L60.1,41.4 L61.4,42.0 L62.0,42.2 L64.7,42.1 L65.8,41.8 L67.1,41.0 L68.1,40.1 L68.6,39.3 L69.0,38.3 L69.1,37.3 L69.1,34.7 L68.8,33.8 L68.2,32.6 L67.0,31.5 L65.5,30.6 L63.8,30.1 Z',
  'M76.4,55.0 L76.1,55.2 L75.5,55.3 L74.6,55.7 L73.5,56.7 L72.8,57.9 L72.5,58.6 L72.5,59.2 L72.5,59.3 L72.5,61.3 L72.6,61.7 L73.0,62.6 L73.3,63.1 L74.2,63.8 L75.0,64.3 L75.2,64.3 L75.4,64.5 L75.8,64.5 L76.4,64.8 L77.7,64.9 L79.9,64.1 L80.6,63.7 L81.1,63.2 L81.4,62.6 L81.6,62.0 L81.8,61.5 L82.1,59.3 L81.8,58.2 L81.1,56.9 L80.5,56.2 L79.9,55.8 L78.5,55.3 L77.8,55.2 L77.5,55.0 Z',
]

// Stagger: each path starts drawing slightly after the previous
// Total animation = 3.2s draw + 0.8s hold
const DELAYS = [0, 0.4, 0.8, 0.2, 0.6, 1.0]
const DRAW_DURATION = 2.5

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/bus', { replace: true })
    }, SPLASH_DURATION)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center"
      style={{ backgroundColor: '#f0fdfa' }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-48 w-48"
        style={{ filter: 'drop-shadow(0 0 8px rgba(13,148,136,0.15))' }}
      >
        {PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{
              animation: `drawPath ${DRAW_DURATION}s ease-out ${DELAYS[i]}s forwards`,
            }}
          />
        ))}
      </svg>
      <p className="mt-6 text-lg font-semibold" style={{ color: '#0d9488' }}>
        School Tool
      </p>
    </div>
  )
}
