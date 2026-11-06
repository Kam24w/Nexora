import { createContext, useContext, type Context } from 'react'

/** Crea un contexto cuyo hook falla de forma explícita si se usa fuera de su Provider. */
export function createStrictContext<T>(name: string): readonly [Context<T | null>, () => T] {
  const context = createContext<T | null>(null)
  context.displayName = name

  const useStrictContext = (): T => {
    const value = useContext(context)
    if (value === null) throw new Error(`use${name} must be used within <${name}Provider>`)
    return value
  }

  return [context, useStrictContext] as const
}
