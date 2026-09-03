import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface ChromeDropdownItem {
  id: string
  label: string
  muted?: boolean
}

interface BusChromeValue {
  dropdownItems?: ChromeDropdownItem[]
  selectedId?: string
  onDropdownSelect?: (id: string) => void
  departed?: boolean
}

interface BusChromeContextValue {
  chrome: BusChromeValue | null
  setChrome: (value: BusChromeValue | null) => void
}

const BusChromeContext = createContext<BusChromeContextValue>({
  chrome: null,
  setChrome: () => {},
})

export function BusChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<BusChromeValue | null>(null)
  const value = useMemo(() => ({ chrome, setChrome }), [chrome])
  return (
    <BusChromeContext.Provider value={value}>{children}</BusChromeContext.Provider>
  )
}

export function useBusChrome() {
  return useContext(BusChromeContext)
}
