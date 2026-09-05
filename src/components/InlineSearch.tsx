interface InlineSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function InlineSearch({
  value,
  onChange,
  placeholder = 'חיפוש...',
}: InlineSearchProps) {
  return (
    <div className="mb-2 px-5">
      <div className="flex h-10 items-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1c1c1e] px-3">
        <svg
          className="h-4 w-4 shrink-0 text-[#98989d]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-white outline-none placeholder:text-[#636366]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="נקה חיפוש"
            className="shrink-0 border-0 bg-transparent p-0 text-[#98989d]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
