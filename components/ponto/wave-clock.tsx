'use client'

import { memo, useEffect, useId, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { ensureGsapRegistered } from '@/lib/gsap/register'

const WAVE_PERIOD = 100
/** Uma crista de onda (período 100) + corpo abaixo — tiles encaixam em loop */
const WAVE_TILE_PATH = 'M0 10 Q25 2 50 10 T100 10 V22 H0 Z'
const WAVE_BODY_TOP = 9

const PULSE_KEYFRAMES = `
@keyframes wave-clock-pulse-ring {
  from { transform: scale(1); opacity: 0.6; }
  to   { transform: scale(1.5); opacity: 0; }
}
`

export type EstadoClock = 'red' | 'yellow' | 'green'

export function getEstadoClock(minutos: number, meta: number): EstadoClock {
  const pct = minutos / meta
  if (pct >= 1) return 'green'
  if (pct >= 0.5) return 'yellow'
  return 'red'
}

const CLOCK_STATE_CONFIG: Record<
  EstadoClock,
  { ringColor: string; waveColor: string; label: string }
> = {
  red: { ringColor: 'border-red-500', waveColor: '#E24B4A', label: 'Início' },
  yellow: { ringColor: 'border-amber-400', waveColor: '#EF9F27', label: 'Progresso' },
  green: { ringColor: 'border-green-500', waveColor: '#639922', label: 'Completo' },
}

const ESTADO_BADGE_CLASS: Record<EstadoClock, string> = {
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
}

function CircularLiquid({
  color,
  fillPercent,
  clipId,
}: {
  color: string
  fillPercent: number
  clipId: string
}) {
  const waveRef = useRef<SVGGElement>(null)
  const liquidRef = useRef<SVGGElement>(null)
  const surfaceY = 100 * (1 - fillPercent)

  useEffect(() => {
    const wave = waveRef.current
    if (!wave) return

    const gsap = ensureGsapRegistered()
    const tween = gsap.fromTo(
      wave,
      { x: 0 },
      {
        x: -WAVE_PERIOD,
        duration: 2.6,
        ease: 'none',
        repeat: -1,
      },
    )

    return () => {
      tween.kill()
    }
  }, [color])

  useEffect(() => {
    const liquid = liquidRef.current
    if (!liquid) return

    const gsap = ensureGsapRegistered()
    gsap.to(liquid, {
      y: surfaceY,
      duration: 0.55,
      ease: 'power2.out',
    })
  }, [surfaceY])

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="46" fill="#0f172a" />

      <g clipPath={`url(#${clipId})`}>
        <g ref={liquidRef} transform={`translate(0 ${surfaceY})`}>
          <g ref={waveRef}>
            <path d={WAVE_TILE_PATH} fill={color} />
            <path d={WAVE_TILE_PATH} fill={color} transform={`translate(${WAVE_PERIOD} 0)`} />
          </g>
          <rect
            x={-WAVE_PERIOD}
            y={WAVE_BODY_TOP}
            width={WAVE_PERIOD * 3}
            height={140}
            fill={color}
          />
        </g>
      </g>
    </svg>
  )
}

export const WaveClock = memo(function WaveClock({
  totalMinutos,
  meta,
}: {
  totalMinutos: number
  meta: number
}) {
  const clipId = useId().replace(/:/g, '')
  const progresso = Math.min((totalMinutos / meta) * 100, 100)
  const estado = getEstadoClock(totalMinutos, meta)
  const config = CLOCK_STATE_CONFIG[estado]
  const isComplete = estado === 'green'
  const fillPercent = Math.max(progresso / 100, 0.04)

  return (
    <div className="flex flex-col items-center gap-2">
      <style>{PULSE_KEYFRAMES}</style>

      <div className="relative">
        {isComplete && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-green-400"
            style={{
              zIndex: 0,
              animation: 'wave-clock-pulse-ring 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        )}

        <div
          className={`relative h-24 w-24 overflow-hidden rounded-full border-4 transition-colors duration-500 ${config.ringColor}`}
          style={{ borderColor: config.waveColor }}
          aria-label={`Progresso diário: ${Math.round(progresso)}%`}
          role="img"
        >
          <CircularLiquid color={config.waveColor} fillPercent={fillPercent} clipId={clipId} />

          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <CheckCircle className="h-9 w-9 text-white drop-shadow" />
                </motion.div>
              ) : (
                <motion.span
                  key="pct"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-white drop-shadow"
                >
                  {Math.round(progresso)}%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium transition-opacity duration-300 ${ESTADO_BADGE_CLASS[estado]}`}
      >
        {config.label}
      </span>
    </div>
  )
})
