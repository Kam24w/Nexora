const initials = (name: string) =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

const SIZES = {
  md: 'size-11 text-sm ring-4',
  xl: 'size-20 text-2xl ring-8',
} as const

/** Iniciales del usuario sobre el degradado de la marca. */
export function Avatar({ name, size = 'md' }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-br from-[#16c4b4] to-[#0a7fa3] font-display font-bold text-white ring-brand-soft ${SIZES[size]}`}
    >
      {initials(name) || '·'}
    </div>
  )
}
