import type { HealthLevel } from '../../types/diagnosis'
import { LEVEL_STYLES } from './levelStyles'

interface GaugeProps {
  /** Valor 0–100; `null` dibuja el estado vacío. */
  value: number | null
  level: HealthLevel
  /** Texto central ya formateado (p. ej. "87,6"). */
  display: string
  unit: string
  label: string
}

const RADIUS = 46
const CENTER = { x: 60, y: 60 }
/** Semicírculo de izquierda a derecha por la parte superior. */
const ARC = `M ${CENTER.x - RADIUS} ${CENTER.y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER.x + RADIUS} ${CENTER.y}`
const TICKS = Array.from({ length: 11 }, (_, i) => i * 10)

const polar = (percent: number, radius: number) => {
  const angle = Math.PI * (1 - percent / 100)
  return { x: CENTER.x + radius * Math.cos(angle), y: CENTER.y - radius * Math.sin(angle) }
}

/** Medidor semicircular accesible (role="meter"). */
export function Gauge({ value, level, display, unit, label }: GaugeProps) {
  const clamped = value === null ? 0 : Math.min(100, Math.max(0, value))
  const needle = polar(clamped, RADIUS - 14)
  const styles = LEVEL_STYLES[level]

  return (
    <div
      role={value === null ? 'img' : 'meter'}
      aria-label={label}
      {...(value !== null && {
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': Math.round(clamped),
        'aria-valuetext': `${display}${unit}`,
      })}
      className="mx-auto flex w-full max-w-[190px] flex-col items-center"
    >
      <svg viewBox="0 0 120 70" className="w-full overflow-visible">
        <path d={ARC} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-surface-sunken" />
        {value !== null && (
          <path
            d={ARC}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${clamped} 100`}
            className={`${styles.stroke} transition-[stroke-dasharray] duration-700 ease-out`}
          />
        )}
        {TICKS.map((tick) => {
          const outer = polar(tick, RADIUS - 8)
          const inner = polar(tick, RADIUS - (tick % 50 === 0 ? 12 : 10))
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              strokeWidth="1"
              className="stroke-line"
            />
          )
        })}
        {value !== null && (
          <g>
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={needle.x}
              y2={needle.y}
              strokeWidth="2.2"
              strokeLinecap="round"
              className="stroke-ink"
            />
            <circle cx={CENTER.x} cy={CENTER.y} r="3.6" className="fill-ink" />
          </g>
        )}
        <text x={CENTER.x - RADIUS} y={CENTER.y + 10} textAnchor="middle" className="fill-muted text-[7px]">
          0
        </text>
        <text x={CENTER.x + RADIUS} y={CENTER.y + 10} textAnchor="middle" className="fill-muted text-[7px]">
          100
        </text>
      </svg>
      <div className="-mt-1 text-center">
        <span className={`font-display text-2xl font-bold tracking-tight tabular-nums ${value === null ? 'text-muted' : styles.text}`}>
          {display}
        </span>
        {value !== null && <span className="ml-0.5 text-xs font-medium text-muted">{unit}</span>}
      </div>
    </div>
  )
}
