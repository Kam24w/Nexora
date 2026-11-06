import { useId } from 'react'

/** Isotipo de Nexora: una "N" en cinta con trazas de circuito. */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  const gradient = `${useId()}-logo`

  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="5" x2="43" y1="8" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ca8bf" />
          <stop offset=".52" stopColor="#16d3c4" />
          <stop offset="1" stopColor="#08749c" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradient})`}
        d="M11 35V14.6c0-4.1 5.3-5.8 7.7-2.5l12.6 17.4c1.7 2.4 5.7 1.2 5.7-1.8V13a4 4 0 1 1 8 0v20.4c0 5.9-7.6 8.3-11.1 3.6L21.3 19.7c-1.3-1.8-4.3-.9-4.3 1.3V35a4 4 0 1 1-8 0Z"
      />
      <path
        fill="none"
        stroke="#d7fbf5"
        strokeLinecap="round"
        strokeWidth="1.5"
        strokeDasharray="1 3"
        d="M15 17v17m3-12v11m16-13v13m4-16v14"
      />
    </svg>
  )
}

/** Logotipo completo: isotipo + marca denominativa. */
export function Logo({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.6rem] leading-none font-bold tracking-[-0.05em] text-ink">{label}</span>
    </span>
  )
}
