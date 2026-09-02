import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Bus } from '../types'

interface BusChromeValue {
  buses: Bus[]
  selectedBusId: string
  departed: boolean
  onSelectBus: (busId: string) => void
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
