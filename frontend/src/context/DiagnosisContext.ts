import type { Diagnosis } from '../types/diagnosis'
import { createStrictContext } from './createStrictContext'

export type DiagnosisError = 'unavailable' | null

export interface DiagnosisContextValue {
  diagnosis: Diagnosis | null
  isAnalyzing: boolean
  error: DiagnosisError
  lastScanAt: Date | null
  analyze: () => void
  dismissError: () => void
}

export const [DiagnosisContext, useDiagnosis] = createStrictContext<DiagnosisContextValue>('Diagnosis')
