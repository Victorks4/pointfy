'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
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

function centerOrb(
  mx: ReturnType<typeof useMotionValue>,
  my: ReturnType<typeof useMotionValue>,
  el: HTMLElement,
) {
  const w = el.clientWidth
  const h = el.clientHeight
  mx.set(w / 2 - ORB_SIZE / 2)
  my.set(h / 2 - ORB_SIZE / 2)
}

export function LoginLeftPanel({ mounted, children }: LoginLeftPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const submitting = useLoginSubmittingAmbient()

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

      {/* Leitura sobre a arte */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-black/35"
        aria-hidden
        animate={
          submitting
            ? reduce
              ? { opacity: 0.34 }
              : { opacity: [0.38, 0.34, 0.38] }
            : reduce
              ? { opacity: 0.42 }
              : { opacity: 0.43 }
        }
        transition={
          submitting && !reduce
            ? LOGIN_SYNC_TRANSITION.pulse
            : { duration: 0.35 }
        }
      />

      {!reduce && (
        <motion.div
          className="pointer-events-none absolute z-[6] backdrop-blur-2xl will-change-transform"
          style={{
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
          } as CSSProperties}
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
          className="pointer-events-none absolute inset-[2%] rounded-[clamp(22px,3vw,40px)] border border-white/[0.12] lg:block"
          aria-hidden
          initial={false}
          animate={
            submitting
              ? { opacity: [0.18, 0.48, 0.18], scale: [0.993, 1.006, 0.993] }
              : { opacity: 0.14, scale: 1 }
          }
          transition={submitting ? LOGIN_SYNC_TRANSITION.pulse : { duration: 0.3 }}
        />
      )}
    </div>
  )
}
