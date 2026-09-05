export default function SideStrip() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(180deg, rgba(62,142,222,0.12) 0%, rgba(155,89,208,0.12) 55%, rgba(224,68,124,0.12) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'scaleY(1.35) rotate(180deg)',
            marginBottom: 76,
            fontFamily: '"Montserrat", -apple-system, sans-serif',
            fontSize: 17,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(180deg, #3E8EDE 0%, #9B59D0 55%, #E0447C 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          new mainstream
        </span>
      </div>
      <a
        href="/"
        aria-label="חזרה לדף הבית"
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          left: 8,
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          color: '#98989d',
          textDecoration: 'none',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9.5L12 3l9 6.5" />
          <path d="M19 9.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9.5" />
        </svg>
      </a>
    </>
  )
}
