import type { ReactNode } from 'react'

export default function PageSheet({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 mt-2 rounded-[22px] bg-[#151A28] px-[14px] py-[14px]">
      {children}
    </div>
  )
}
