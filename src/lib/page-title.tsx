import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface PageTitleContextValue {
  title: string
  setTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextValue>({
  title: 'School Tool',
  setTitle: () => {},
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('School Tool')
  const value = useMemo(() => ({ title, setTitle }), [title])
  return (
    <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}
