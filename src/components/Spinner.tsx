interface SpinnerProps {
  compact?: boolean
  onDark?: boolean
}

export default function Spinner({ compact = false, onDark = false }: SpinnerProps) {
  return (
    <div
      className={
        compact
          ? 'flex items-center justify-center gap-2'
          : 'flex min-h-40 flex-col items-center justify-center gap-3'
      }
      role="status"
      aria-live="polite"
    >
      <div
        className={
          compact
            ? onDark
              ? 'h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white'
              : 'h-5 w-5 animate-spin rounded-full border-2 border-[#3a3a3c] border-t-[#3D90F0]'
            : 'h-10 w-10 animate-spin rounded-full border-4 border-[#3a3a3c] border-t-[#3D90F0]'
        }
      />
      <span
        className={
          compact
            ? onDark
              ? 'text-sm font-medium text-white'
              : 'text-sm font-medium text-[#C0C0C6]'
            : 'text-base text-[#98989d]'
        }
      >
        טוען...
      </span>
    </div>
  )
}

export function ConnectionError() {
  return (
    <p className="mt-12 px-4 text-center text-red-400" role="alert">
      לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.
    </p>
  )
}
