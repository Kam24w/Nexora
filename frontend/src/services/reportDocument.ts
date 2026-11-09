import { translate } from '../i18n'
import type { HealthLevel } from '../types/diagnosis'
import type { TranslationKey, TranslationParams } from '../types/i18n'
import type { Language } from '../types/preferences'
import { parseHardware } from './hardwareService'
import { getHighlightedProcesses, getLevel, getTemperatureLevel } from './healthService'
import type { StoredReport } from './reportsService'

/**
 * Documento A4 de un informe, pensado para imprimirse o guardarse como PDF: tipografía
 * del sistema, sin navegación ni controles, y todas las etiquetas en `language`.
 */

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)

const STATUS_LEVEL = { NORMAL: 'ok', WARNING: 'warn', CRITICAL: 'crit' } as const satisfies Record<string, HealthLevel>

const STYLES = `
@page { size: A4; margin: 16mm 15mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 10.5pt/1.5 "Segoe UI", system-ui, -apple-system, sans-serif; color: #142a37; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
h1, h2, h3 { margin: 0; line-height: 1.25; }
h2 { font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: #3f5863; margin: 0 0 6pt; }
p { margin: 0; }
section { margin-top: 14pt; break-inside: avoid; }
.top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16pt; padding-bottom: 12pt; border-bottom: 2pt solid #0a7c83; }
.brand { font-weight: 700; font-size: 11pt; color: #0a7c83; letter-spacing: -.02em; }
.top h1 { font-size: 17pt; margin-top: 2pt; }
.meta { color: #3f5863; font-size: 9pt; margin-top: 3pt; }
.pill { border-radius: 99pt; padding: 4pt 10pt; font-weight: 600; font-size: 9pt; white-space: nowrap; }
.ok { background: #e3f6f0; color: #0a7461; } .warn { background: #fff3e1; color: #8f5200; } .crit { background: #fdecee; color: #bf2f3b; }
.score { display: flex; gap: 14pt; align-items: center; margin-top: 14pt; padding: 10pt 12pt; border-radius: 10pt; background: #f4f9f9; }
.ring { width: 52pt; height: 52pt; border-radius: 50%; display: grid; place-items: center; font-size: 17pt; font-weight: 700; border: 4pt solid currentColor; flex: none; background: #fff; }
.score h3 { font-size: 11pt; }
.summary { margin-top: 12pt; font-size: 11pt; }
.cause { border: 1pt solid #b9dfdf; background: #f1fafa; border-radius: 10pt; padding: 10pt 12pt; }
.cause h3 { font-size: 12pt; margin-bottom: 3pt; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: #3f5863; border-bottom: 1pt solid #c9d6da; padding: 4pt 6pt; }
td { padding: 5pt 6pt; border-bottom: .5pt solid #e1ebee; vertical-align: top; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.metrics td { width: 33.3%; border: .5pt solid #e1ebee; }
.metrics strong { display: block; font-size: 13pt; }
.metrics span { color: #3f5863; font-size: 8.5pt; }
ul.findings, ol.solutions { list-style: none; padding: 0; margin: 0; display: grid; gap: 6pt; }
ul.findings li, ol.solutions > li { border: .5pt solid #d5e2e5; border-radius: 8pt; padding: 7pt 10pt; break-inside: avoid; }
.tag { display: inline-block; border-radius: 99pt; padding: 0 6pt; font-size: 8pt; font-weight: 600; margin-right: 6pt; }
.detail { color: #3f5863; margin-top: 2pt; }
.solutions .head { display: flex; justify-content: space-between; gap: 8pt; }
.solutions .num { display: inline-grid; place-items: center; width: 15pt; height: 15pt; border-radius: 50%; background: #0a7c83; color: #fff; font-size: 8pt; font-weight: 700; margin-right: 5pt; }
.solutions ol { margin: 4pt 0 0 18pt; padding: 0; color: #3f5863; }
.impact { font-size: 8pt; color: #066770; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
.note { margin-top: 10pt; font-size: 8.5pt; color: #3f5863; font-style: italic; }
footer { margin-top: 18pt; padding-top: 8pt; border-top: .5pt solid #c9d6da; font-size: 8pt; color: #587079; }
`

export const buildReportDocument = (
  { id, createdAt, payload }: StoredReport,
  language: Language,
  options: { translatedFrom?: Language } = {},
): string => {
  const t = (key: TranslationKey, params?: TranslationParams) => escape(translate(language, key, params))
  const number = (value: number, digits = 1) => new Intl.NumberFormat(language, { maximumFractionDigits: digits }).format(value)
  const date = (value: string | Date, style: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeStyle: 'short' }) => {
    const parsed = typeof value === 'string' ? new Date(value) : value
    return Number.isNaN(parsed.getTime()) ? '—' : escape(new Intl.DateTimeFormat(language, style).format(parsed))
  }
  const pct = (value: number) => t('common.percent', { value: number(value) })
  const { telemetry } = payload
  const level = STATUS_LEVEL[payload.status]
  const source = payload.source === 'ai' ? t('diagnosis.source.ai', { model: payload.model ?? 'LLM' }) : t('diagnosis.source.rules')
  const scanType = t(payload.scan_type === 'deep' ? 'scan.types.advanced' : 'scan.types.basic')

  const metric = (label: string, value: string, metricLevel: HealthLevel | null) =>
    `<td><span>${label}</span><strong class="${metricLevel ?? ''}" style="background:none">${value}</strong></td>`

  const metrics = [
    metric(t('dashboard.metrics.cpu'), pct(telemetry.cpu), getLevel('cpu', telemetry.cpu)),
    metric(t('dashboard.metrics.ram'), pct(telemetry.ram), getLevel('ram', telemetry.ram)),
    metric(t('dashboard.metrics.disk'), pct(telemetry.disk_space), getLevel('disk', telemetry.disk_space)),
    metric(
      t('dashboard.metrics.temperature'),
      telemetry.cpu_temperature === null ? t('dashboard.metrics.temperatureUnavailable') : t('common.celsius', { value: number(telemetry.cpu_temperature) }),
      telemetry.cpu_temperature === null ? null : getTemperatureLevel(telemetry.cpu_temperature),
    ),
    metric(t('dashboard.metrics.read'), t('common.mbps', { value: number(telemetry.disk_read, 2) }), null),
    metric(t('dashboard.metrics.write'), t('common.mbps', { value: number(telemetry.disk_write, 2) }), null),
  ]

  const findings = payload.findings.length
    ? `<section><h2>${t('diagnosis.findings.title')}</h2><ul class="findings">${payload.findings
        .map(
          (finding) =>
            `<li><span class="tag ${finding.severity}">${t(`dashboard.levels.${finding.severity}`)}</span><strong>${escape(finding.title)}</strong>${
              finding.detail ? `<p class="detail">${escape(finding.detail)}</p>` : ''
            }</li>`,
        )
        .join('')}</ul></section>`
    : ''

  const solutions = payload.solutions.length
    ? `<section><h2>${t('diagnosis.solutions.title')}</h2><ol class="solutions">${payload.solutions
        .map(
          (solution, index) =>
            `<li><div class="head"><strong><span class="num">${index + 1}</span>${escape(solution.title)}</strong><span class="impact">${t(
              `diagnosis.solutions.impact.${solution.impact}`,
            )}</span></div>${solution.description ? `<p class="detail">${escape(solution.description)}</p>` : ''}${
              solution.steps.length ? `<ol>${solution.steps.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>` : ''
            }</li>`,
        )
        .join('')}</ol></section>`
    : ''

  const processes = telemetry.processes.length
    ? `<section><h2>${t('reports.detail.processes')}</h2><table><thead><tr><th>${t('dashboard.processes.name')}</th><th>${t(
        'reportDocument.category',
      )}</th><th class="num">${t('dashboard.processes.cpu')}</th><th class="num">${t('dashboard.processes.memory')}</th></tr></thead><tbody>${getHighlightedProcesses(
        telemetry.processes,
        8,
      )
        .map(
          (process) =>
            `<tr><td>${escape(process.name)}</td><td>${t(`processes.category.${process.category}`)}</td><td class="num">${pct(process.cpu)}</td><td class="num">${pct(
              process.memory,
            )}</td></tr>`,
        )
        .join('')}</tbody></table></section>`
    : ''

  const hardware = telemetry.hardware ? parseHardware(telemetry.hardware) : null
  const hardwareSection = hardware
    ? `<section><h2>${t('profile.hardware.title')}</h2><table><tbody>${[
        [t('profile.hardware.cpu'), hardware.cpuModel],
        [t('profile.hardware.ram'), hardware.ramTotalGb === null ? null : t('common.gb', { value: number(hardware.ramTotalGb) })],
        [t('profile.hardware.storage'), hardware.storage.map((drive) => `${drive.model ?? ''} ${drive.totalGb === null ? '' : `(${number(drive.totalGb)} GB)`}`.trim()).join(', ')],
        [t('profile.hardware.gpu'), hardware.gpus.join(', ')],
      ]
        .map(([label, value]) => `<tr><th style="width:30%">${label}</th><td>${value ? escape(value) : t('profile.hardware.unknown')}</td></tr>`)
        .join('')}</tbody></table></section>`
    : ''

  return `<!doctype html>
<html lang="${language}">
<head><meta charset="utf-8"><title>${t('reportDocument.fileTitle', { date: date(createdAt, { dateStyle: 'medium' }) })}</title><style>${STYLES}</style></head>
<body>
<header class="top">
  <div><p class="brand">Nexora</p><h1>${t('reportDocument.title')}</h1><p class="meta">${date(createdAt)} · ${scanType} · ${source}</p></div>
  <p class="pill ${level}">${t(`diagnosis.status.${payload.status}.label`)}</p>
</header>
<section class="score ${level}" style="background:#f4f9f9">
  <div class="ring">${payload.health_score}</div>
  <div><h3 style="color:#142a37">${t('diagnosis.health.title')} · ${payload.health_score}${t('diagnosis.health.outOf')}</h3><p style="color:#3f5863">${t(
    `diagnosis.status.${payload.status}.description`,
  )}</p></div>
</section>
${payload.summary ? `<p class="summary">${escape(payload.summary)}</p>` : ''}
<section class="cause"><h2>${t('diagnosis.probableCause')}</h2><h3>${escape(payload.probable_cause.title)}</h3>${
    payload.probable_cause.explanation ? `<p>${escape(payload.probable_cause.explanation)}</p>` : ''
  }</section>
<section><h2>${t('reports.detail.telemetry')}</h2><table class="metrics"><tbody><tr>${metrics.slice(0, 3).join('')}</tr><tr>${metrics.slice(3).join('')}</tr></tbody></table></section>
${findings}
${solutions}
${processes}
${hardwareSection}
${options.translatedFrom ? `<p class="note">${t('reportDocument.translatedNote', { language: translate(language, `languages.${options.translatedFrom}`) })}</p>` : ''}
<footer>${t('reportDocument.footer', { id: id.slice(0, 8), date: date(new Date()) })}</footer>
</body>
</html>`
}
