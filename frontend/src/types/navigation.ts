/** Vistas de la aplicación. `chat` cuelga de Informes y necesita el id del informe. */
export const APP_VIEWS = ['dashboard', 'analysis', 'reports', 'profile', 'chat'] as const
export type AppView = (typeof APP_VIEWS)[number]

export interface AppRoute {
  view: AppView
  reportId: string | null
}

/** Lee la ruta del hash: `#reports`, `#chat/<id>`… Cualquier otra cosa lleva al panel. */
export const parseRoute = (hash: string): AppRoute => {
  const [view, id] = hash.replace(/^#/, '').split('/')
  if (view === 'chat') return id ? { view: 'chat', reportId: decodeURIComponent(id) } : { view: 'reports', reportId: null }
  return { view: APP_VIEWS.find((candidate) => candidate === view) ?? 'dashboard', reportId: null }
}

export const routeHash = ({ view, reportId }: AppRoute): string => {
  if (view === 'dashboard') return ''
  return view === 'chat' && reportId ? `chat/${encodeURIComponent(reportId)}` : view
}
