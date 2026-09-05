export default function HeroGlow() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        background:
          'radial-gradient(ellipse 70% 100% at 75% 0%, rgba(0,113,227,0.22), transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
