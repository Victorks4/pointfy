/**
 * Hook para detectar estado idle do usuário
 * Monitora atividade para controlar comportamentos de "entediado" e "dormindo" do Fy
 */

import { useEffect, useRef, useCallback } from 'react'
import { fyEmit } from '@/lib/fy-event-bus'

const IDLE_THRESHOLD_BORED = 30000 // 30s para ficar entediado
const IDLE_THRESHOLD_SLEEP = 60000 // 60s para dormir

interface UseFyIdleTrackerOptions {
  /** Callback quando entra em idle */
  onIdleStart?: () => void
  /** Callback quando sai de idle */
  onIdleEnd?: () => void
  /** Callback quando atinge threshold de tédio (30s) */
  onBored?: () => void
  /** Callback quando atinge threshold de sono (60s) */
  onSleep?: () => void
  /** Callback quando acorda */
  onWake?: () => void
  /** Habilita o tracking */
  enabled?: boolean
}

export function useFyIdleTracker(options: UseFyIdleTrackerOptions = {}) {
  const {
    onIdleStart,
    onIdleEnd,
    onBored,
    onSleep,
    onWake,
    enabled = true,
  } = options

  const lastActivityRef = useRef<number>(Date.now())
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const boredTriggeredRef = useRef(false)
  const sleepTriggeredRef = useRef(false)
  const isIdleRef = useRef(false)

  const triggerWake = useCallback(() => {
    if (isIdleRef.current) {
      isIdleRef.current = false
      boredTriggeredRef.current = false
      sleepTriggeredRef.current = false
      onWake?.()
      fyEmit({ type: 'fy:wake' })
      fyEmit({ type: 'fy:idle_end' })
    }
  }, [onWake])

  const checkIdle = useCallback(() => {
    const now = Date.now()
    const idleTime = now - lastActivityRef.current

    if (!isIdleRef.current && idleTime >= IDLE_THRESHOLD_BORED) {
      isIdleRef.current = true
      onIdleStart?.()
      fyEmit({ type: 'fy:idle_start' })
    }

    if (isIdleRef.current) {
      if (!boredTriggeredRef.current && idleTime >= IDLE_THRESHOLD_BORED) {
        boredTriggeredRef.current = true
        onBored?.()
      }

      if (!sleepTriggeredRef.current && idleTime >= IDLE_THRESHOLD_SLEEP) {
        sleepTriggeredRef.current = true
        onSleep?.()
      }
    }

    // Schedule next check
    idleTimerRef.current = setTimeout(checkIdle, 1000)
  }, [onIdleStart, onBored, onSleep])

  const resetIdle = useCallback(() => {
    const wasIdle = isIdleRef.current
    lastActivityRef.current = Date.now()
    boredTriggeredRef.current = false
    sleepTriggeredRef.current = false

    if (wasIdle) {
      triggerWake()
    }
  }, [triggerWake])

  useEffect(() => {
    if (!enabled) return

    const handleActivity = () => {
      resetIdle()
    }

    // Event listeners para atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'wheel']
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Start idle checker
    idleTimerRef.current = setTimeout(checkIdle, 1000)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [enabled, checkIdle, resetIdle])

  return {
    resetIdle,
  }
}
