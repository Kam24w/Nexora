export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const LANGUAGES = ['es', 'en'] as const
export type Language = (typeof LANGUAGES)[number]
