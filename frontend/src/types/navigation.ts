/** Vistas principales de la aplicación (barra lateral). */
export const APP_VIEWS = ['dashboard', 'analysis', 'reports', 'profile'] as const
export type AppView = (typeof APP_VIEWS)[number]
