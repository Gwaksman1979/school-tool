import type { ReactNode } from 'react'

export default function PageSheet({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 mt-1 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#14161f] px-[14px] py-2">
      {children}
    </div>
  )
}
