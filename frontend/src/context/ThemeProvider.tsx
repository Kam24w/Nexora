import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { storage, STORAGE_KEYS } from '../services/storage'
import { THEMES, type Theme } from '../types/preferences'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'

/** Modo claro por defecto; solo se usa el oscuro si el usuario lo eligió antes. */
const readStoredTheme = (): Theme => {
  const stored = storage.get(STORAGE_KEYS.theme)
  return THEMES.find((theme) => theme === stored) ?? 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  // useLayoutEffect: la clase se aplica antes de pintar y no hay destello de tema incorrecto.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    storage.set(STORAGE_KEYS.theme, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      storage.set(STORAGE_KEYS.theme, next)
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
