import type { Theme } from '../types/preferences'
import { createStrictContext } from './createStrictContext'

export interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const [ThemeContext, useTheme] = createStrictContext<ThemeContextValue>('Theme')
