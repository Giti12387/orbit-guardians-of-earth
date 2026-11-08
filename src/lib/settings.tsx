import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadState, updateSettings, type SettingsState } from '../store/gameStore'

type Ctx = { settings: SettingsState; setSettings: (patch: Partial<SettingsState>) => void }
const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<SettingsState>(() => loadState().settings)
  const value = useMemo<Ctx>(
    () => ({
      settings,
      setSettings: (patch) => {
        const next = updateSettings(patch)
        setSettingsState(next.settings)
      },
    }),
    [settings],
  )

  useEffect(() => {
    const reduce = settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.dataset.reducedMotion = reduce ? 'true' : 'false'
  }, [settings.reducedMotion])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

export function prefersReducedMotion(settings: SettingsState) {
  return settings.reducedMotion || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}
