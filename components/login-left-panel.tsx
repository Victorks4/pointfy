'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionStyle,
  type MotionValue,
} from 'framer-motion'

import { LOGIN_SYNC_TRANSITION, useLoginSubmittingAmbient } from '@/lib/login-ambient-context'

type LoginLeftPanelProps = {
  mounted: boolean
  children: ReactNode
}

/** Disco glass que segue o cursor — bem compacto para não cobrir a arte */
const ORB_SIZE = 43

const FLOAT_SHAPES = [
  { cls: 'left-[6%] top-[14%]', frame: 'h-14 w-14', delay: 0, rot: [-14, 14, -8, -14] as const },
  { cls: 'right-[14%] top-[26%]', frame: 'h-24 w-24 rounded-full', delay: 0.55, rot: [-4, 8, -6, -4] as const },
  { cls: 'left-[42%] top-[8%]', frame: 'h-16 w-16', delay: 1.18, rot: [14, -10, 6, 14] as const },
  { cls: 'right-[8%] bottom-[18%]', frame: 'h-28 w-28', delay: 0.82, rot: [22, 8, -12, 22] as const },
  { cls: 'left-[20%] bottom-[12%]', frame: 'h-14 w-14 rounded-[14px]', delay: 0.28, rot: [-12, 6, -4, -12] as const },
] as const

function centerOrb(mx: MotionValue<number>, my: MotionValue<number>, el: HTMLElement) {
  const w = el.clientWidth
  const h = el.clientHeight
  mx.set(w / 2 - ORB_SIZE / 2)
  my.set(h / 2 - ORB_SIZE / 2)
}

export function LoginLeftPanel({ mounted, children }: LoginLeftPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const submitting = useLoginSubmittingAmbient()
  const liquidUid = useId().replace(/:/g, '')
  const liquidGradId = `pf-liq-${liquidUid}`

  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const gx = useSpring(mx, { stiffness: 460, damping: 42 })
  const gy = useSpring(my, { stiffness: 460, damping: 42 })

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = rootRef.current
      if (!el || reduce) return
      const r = el.getBoundingClientRect()
      mx.set(e.clientX - r.left - ORB_SIZE / 2)
      my.set(e.clientY - r.top - ORB_SIZE / 2)
    },
    [mx, my, reduce],
  )

  const onPointerLeave = useCallback(() => {
    const el = rootRef.current
    if (!el || reduce) return
    centerOrb(mx, my, el)
  }, [mx, my, reduce])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    centerOrb(mx, my, el)
    const ro = new ResizeObserver(() => centerOrb(mx, my, el))
    ro.observe(el)
    return () => ro.disconnect()
  }, [mx, my])

  const floatDur = submitting ? 2.85 : 5.4

  return (
    <div
      ref={rootRef}
      className="relative hidden min-h-dvh w-full shrink-0 overflow-hidden lg:flex lg:min-h-0 lg:w-1/2 lg:self-stretch"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        className="absolute inset-0"
        aria-hidden
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={
          mounted
            ? reduce
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: 1 }
            : reduce
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.94 }
        }
        transition={{
          duration: reduce ? 0 : 0.78,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Image
          src="/imagelogin.png"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-[50%_50%]"
        />
      </motion.div>

      {!reduce && (
        <motion.div
          className="pointer-events-none absolute z-[6] backdrop-blur-2xl will-change-transform"
          style={
            {
              width: ORB_SIZE,
              height: ORB_SIZE,
              marginLeft: 0,
              marginTop: 0,
              borderRadius: ORB_SIZE,
              x: gx,
              y: gy,
              background:
                'radial-gradient(ellipse 92% 92% at 50% 50%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.04) 72%, transparent 92%)',
              border: '1px solid rgba(255,255,255,0.45)',
              boxShadow:
                '0 10px 26px rgba(13,71,161,0.22), inset 0 1px 0 rgba(255,255,255,0.45)',
            } satisfies MotionStyle
          }
          aria-hidden
        />
      )}

      {/* Formas translúcidas animadas */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[5]"
        aria-hidden
        animate={
          submitting && !reduce
            ? { opacity: [0.78, 0.98, 0.78], scale: [1, 1.024, 1] }
            : { opacity: 0.94, scale: 1 }
        }
        transition={
          submitting && !reduce
            ? LOGIN_SYNC_TRANSITION.pulse
            : { duration: 0.45 }
        }
      >
        {FLOAT_SHAPES.map((shape, idx) => (
          <motion.div
            key={idx}
            className={`pointer-events-none absolute border-2 border-white/28 bg-white/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${shape.cls} ${shape.frame}`}
            animate={
              reduce
                ? undefined
                : {
                    x: idx % 2 === 0 ? ['0%', '8%', '-4%', '0%'] : ['0%', '-14%', '6%', '0%'],
                    y:
                      idx % 2 === 0
                        ? ['0%', '-22%', '14%', '-6%', '0%']
                        : ['0%', '18%', '-10%', '8%', '0%'],
                    rotate: [...shape.rot],
                  }
            }
            transition={{
              duration: floatDur + shape.delay * 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: shape.delay,
            }}
          />
        ))}
      </motion.div>

      {/* Partículas sutis */}
      {!reduce &&
        [12, 22, 33, 48, 58, 71, 84, 90].map((left, idx) => (
          <motion.div
            key={`p-${left}`}
            className="pointer-events-none absolute z-[4]"
            aria-hidden
            style={{ left: `${left}%`, top: `${(idx * 9 + 21) % 85}%` }}
            animate={{
              y: [0, -18, -6, 10, 0],
              opacity: [0.08, 0.45, 0.25, 0.18, 0.08],
            }}
            transition={{
              duration: 6.2 + idx * 0.45,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: submitting ? idx * 0.08 : idx * 0.22,
            }}
          >
            <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.55)]" />
          </motion.div>
        ))}

      {/* Onda líquida inferior — neon suave */}
      {!reduce && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[30%] min-h-[7rem] max-h-[220px]"
          aria-hidden
        >
          <svg
            className="h-full w-[118%] max-w-none -translate-x-[8%]"
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={liquidGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(125,211,252,0.5)" />
                <stop offset="45%" stopColor="rgba(59,130,246,0.2)" />
                <stop offset="100%" stopColor="rgba(2,6,23,0)" />
              </linearGradient>
            </defs>
            <motion.g
              animate={{ x: [-48, -120, -48] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                fill={`url(#${liquidGradId})`}
                d="M0 108 C280 74 460 154 740 94 C944 54 1090 128 1380 86 L1460 220 L0 220 Z"
              />
            </motion.g>
          </svg>
        </div>
      )}

      <motion.div
        className="relative z-10 flex min-h-dvh w-full flex-1 flex-col lg:min-h-0"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={
          mounted
            ? { opacity: 1, scale: 1 }
            : reduce
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.93 }
        }
        transition={{
          duration: reduce ? 0 : 0.72,
          delay: reduce ? 0 : 0.12,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>

      {/* Pulso estrutural (sincronizado com botão quando submitting) */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute inset-[2%] z-[8] rounded-[clamp(22px,3vw,40px)] border border-white/[0.13] lg:block"
          aria-hidden
          initial={false}
          style={{ boxSizing: 'border-box' }}
          animate={
            submitting
              ? {
                  opacity: [0.26, 0.62, 0.26],
                  scale: [0.993, 1.008, 0.993],
                  boxShadow: [
                    'inset 0 0 0 1px rgba(34,211,238,0.18), 0 0 40px rgba(34,211,238,0.18)',
                    'inset 0 0 0 1px rgba(165,243,254,0.38), 0 0 64px rgba(56,189,248,0.32)',
                    'inset 0 0 0 1px rgba(34,211,238,0.18), 0 0 40px rgba(34,211,238,0.18)',
                  ],
                }
              : { opacity: 0.16, scale: 1, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }
          }
          transition={submitting ? LOGIN_SYNC_TRANSITION.pulse : { duration: 0.3 }}
        />
      )}
    </div>
  )
}
