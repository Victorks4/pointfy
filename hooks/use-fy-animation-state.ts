/**
 * Hook de estado centralizado para animações do Fy
 * Gerencia mood, fase de animação, e estados de interação
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fyEmit, useFyEventSubscription } from '@/lib/fy-event-bus'
import type { FyMood, FyReaction } from '@/lib/fy-mascot'
import { useFyIdleTracker } from '@/hooks/use-fy-idle-tracker'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

export type FyAnimationPhase = 'idle' | 'alert' | 'celebrate' | 'sleeping' | 'waking' | 'bored'

interface FyAnimationState {
  mood: FyMood
  phase: FyAnimationPhase
  isHovered: boolean
  isIdle: boolean
  idleSeconds: number
  unreadCount: number
}

const REACTION_DURATION = {
  celebrate: 2000,
  alert: 1500,
  wake: 1200,
  bored: 3000,
}

export function useFyAnimationState(): FyAnimationState {
  const prefersReducedMotion = usePrefersReducedMotion()

  const [mood, setMood] = useState<FyMood>('neutro')
  const [phase, setPhase] = useState<FyAnimationPhase>('idle')
  const [isHovered, setIsHovered] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [idleSeconds, setIdleSeconds] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearReactionTimeout = useCallback(() => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current)
      reactionTimeoutRef.current = null
    }
  }, [])

  const triggerReaction = useCallback((mood: FyMood, animation: FyAnimationPhase) => {
    if (prefersReducedMotion) {
      // Versão reduzida - apenas muda o mood sem animações
      setMood(mood)
      return
    }

    setMood(mood)
    setPhase(animation)

    const duration = REACTION_DURATION[animation as keyof typeof REACTION_DURATION] || 2000
    reactionTimeoutRef.current = setTimeout(() => {
      setPhase('idle')
      setMood('neutro')
    }, duration)
  }, [prefersReducedMotion])

  // Subscription a eventos do Fy
  useFyEventSubscription((event) => {
    switch (event.type) {
      case 'ponto:saved':
        if (event.success) {
          triggerReaction('alegria', 'celebrate')
        }
        break
      case 'ponto:error':
        triggerReaction('aviso', 'alert')
        break
      case 'fy:hover':
        setIsHovered(true)
        if (isIdle || phase === 'sleeping') {
          triggerReaction('neutro', 'waking')
        }
        break
      case 'fy:click':
        setIsHovered(false)
        break
      case 'notification:unread':
        setUnreadCount(event.count)
        if (event.count > 0 && phase !== 'celebrate') {
          setMood('atencao')
        } else if (event.count === 0) {
          setMood('neutro')
        }
        break
      case 'fy:wake':
        triggerReaction('neutro', 'waking')
        setIsIdle(false)
        setIdleSeconds(0)
        break
      case 'fy:idle_start':
        setIsIdle(true)
        break
      case 'fy:idle_end':
        setIsIdle(false)
        setIdleSeconds(0)
        break
    }
  })

  // Idle tracker integrado
  useFyIdleTracker({
    enabled: !isHovered && phase !== 'celebrate' && phase !== 'alert',
    onIdleStart: () => {
      setIsIdle(true)
    },
    onBored: () => {
      if (!prefersReducedMotion) {
        setMood('entediado')
        setPhase('bored')
      }
    },
    onSleep: () => {
      if (!prefersReducedMotion) {
        setMood('dormindo')
        setPhase('sleeping')
      }
    },
    onWake: () => {
      setMood('neutro')
      setPhase('idle')
      setIsIdle(false)
      setIdleSeconds(0)
    },
  })

  // Contador de segundos idle
  useEffect(() => {
    if (isIdle && !prefersReducedMotion) {
      idleIntervalRef.current = setInterval(() => {
        setIdleSeconds((s) => s + 1)
      }, 1000)
    } else {
      setIdleSeconds(0)
    }

    return () => {
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current)
      }
    }
  }, [isIdle, prefersReducedMotion])

  // Hover handlers
  const handleHoverStart = useCallback(() => {
    setIsHovered(true)
    fyEmit({ type: 'fy:hover' })
  }, [])

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleClick = useCallback(() => {
    fyEmit({ type: 'fy:click' })
  }, [])

  useEffect(() => {
    return () => {
      clearReactionTimeout()
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current)
      }
    }
  }, [clearReactionTimeout])

  return {
    mood,
    phase,
    isHovered,
    isIdle,
    idleSeconds,
    unreadCount,
  }
}
