export default function SideStrip() {
  return (
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
          'linear-gradient(180deg, rgba(62,142,222,0.16) 0%, rgba(155,89,208,0.16) 55%, rgba(224,68,124,0.16) 100%)',
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
  )
}
