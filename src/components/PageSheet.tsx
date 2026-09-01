import type { ReactNode } from 'react'

export default function PageSheet({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 mt-2 min-w-0 overflow-hidden rounded-3xl bg-white px-4 py-3 shadow-sm">
      {children}
    </div>
  )
}
