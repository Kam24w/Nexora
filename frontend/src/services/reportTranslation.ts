import type { ReportTranslation } from './reportAssistantService'
import type { DiagnosticReportPayload } from './reportsService'

/**
 * Sustituye los textos del informe por los traducidos, posición a posición. Las cifras,
 * severidades e impactos no se traducen: se conservan del original.
 */
export const applyTranslation = (payload: DiagnosticReportPayload, translation: ReportTranslation): DiagnosticReportPayload => ({
  ...payload,
  language: translation.language,
  summary: translation.summary || payload.summary,
  probable_cause: {
    ...payload.probable_cause,
    title: translation.probable_cause.title || payload.probable_cause.title,
    explanation: translation.probable_cause.explanation || payload.probable_cause.explanation,
  },
  findings: payload.findings.map((finding, index) => ({
    ...finding,
    title: translation.findings[index]?.title || finding.title,
    detail: translation.findings[index]?.detail ?? finding.detail,
  })),
  solutions: payload.solutions.map((solution, index) => ({
    ...solution,
    title: translation.solutions[index]?.title || solution.title,
    description: translation.solutions[index]?.description ?? solution.description,
    steps: solution.steps.map((step, stepIndex) => translation.solutions[index]?.steps[stepIndex] || step),
  })),
})
