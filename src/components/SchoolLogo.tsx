interface SchoolLogoProps {
  size?: number
  animated?: boolean
}

export default function SchoolLogo({ size = 88, animated = false }: SchoolLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M74 22H43a15 15 0 0 0 0 30"
        stroke="#3D90F0"
        strokeWidth="9.5"
        strokeLinecap="round"
        pathLength={animated ? 1 : undefined}
        className={animated ? 'splash-draw' : undefined}
      />
      <path
        d="M26 74h31a15 15 0 0 0 0-30"
        stroke="#FFFFFF"
        strokeWidth="9.5"
        strokeLinecap="round"
        pathLength={animated ? 1 : undefined}
        className={animated ? 'splash-draw splash-draw-delay' : undefined}
      />
    </svg>
  )
}
