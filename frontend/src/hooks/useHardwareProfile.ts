import { useCallback, useEffect, useState } from 'react'
import { isAbortError } from '../services/apiClient'
import { hardwareService } from '../services/hardwareService'
import type { HardwareProfile } from '../types/hardware'

export type HardwareState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; hardware: HardwareProfile }

export function useHardwareProfile() {
  const [state, setState] = useState<HardwareState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    hardwareService.get(controller.signal).then(
      (hardware) => setState({ status: 'ready', hardware }),
      (reason) => {
        if (!isAbortError(reason)) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}
