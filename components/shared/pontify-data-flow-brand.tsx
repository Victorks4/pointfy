'use client'

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type PontifyDataFlowBrandProps = {
  variant?: 'sidebar' | 'inline'
}

/** P + onda + PONTIFY — fluidez tipo fluxo de dados (SVG animado via Framer Motion) */
export function PontifyDataFlowBrand({ variant = 'inline' }: PontifyDataFlowBrandProps) {
  const reduce = useReducedMotion()
  const rid = useId().replace(/:/g, '')
  const gradId = `pf-neon-${rid}`

  const dense = variant === 'sidebar'

  return (
    <div
      className={`relative flex items-center gap-2 ${dense ? 'mt-2 w-full px-1' : 'justify-center px-2'}`}
      aria-hidden
    >
      <span
        className={`relative z-[2] shrink-0 font-black tabular-nums text-white ${
          dense ? 'text-[11px]' : 'text-sm sm:text-base'
        }`}
        style={{
          textShadow: '0 0 24px rgb(147 197 253 / .35)',
        }}
      >
        P
      </span>

      <div
        className={`relative min-w-[2.75rem] flex-1 overflow-hidden rounded-full ${
          dense ? 'min-h-[12px] max-w-none' : 'min-h-[14px] max-w-[8.5rem]'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[7px] rounded-full bg-sky-500/15 blur-sm" />

        <div className="pointer-events-none absolute inset-x-2 top-[45%] z-[1] flex -translate-y-1/2 items-center gap-[3px] opacity-65">
          {Array.from({ length: dense ? 9 : 12 }).map((_, i) => (
            <span
              key={i}
              className={`rounded-full bg-sky-200/45 ${dense ? 'h-[4px] w-[4px]' : 'h-[5px] w-[6px]'}`}
            />
          ))}
        </div>

        <svg
          className={`relative z-[3] w-full opacity-95 ${dense ? 'h-[10px]' : 'h-[14px]'}`}
          preserveAspectRatio="none"
          viewBox="0 0 140 14"
          fill="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(125 211 252)" stopOpacity="0.15" />
              <stop offset="35%" stopColor="rgb(56 189 248)" stopOpacity="0.95" />
              <stop offset="55%" stopColor="rgb(191 219 254)" stopOpacity="1" />
              <stop offset="70%" stopColor="rgb(56 189 248)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgb(125 211 252)" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0 10 Q 17.5 2 35 10 T70 10 T105 10 T140 10"
            stroke={`url(#${gradId})`}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            fill="none"
            initial={reduce ? false : { pathLength: 0.35, opacity: 0.7 }}
            animate={
              reduce
                ? { pathLength: 1, opacity: 0.85 }
                : {
                    pathLength: [0.25, 0.92, 0.25],
                    opacity: [0.55, 1, 0.55],
                  }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    duration: 2.9,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          />
        </svg>
      </div>

      <span
        className={`relative z-[2] shrink-0 font-semibold uppercase tracking-[0.22em] text-white ${
          dense ? 'max-w-[6.75rem] truncate text-[9px]' : 'text-[10px] sm:text-xs'
        }`}
        style={{
          textShadow: dense
            ? '0 0 18px rgb(147 197 253 / .3)'
            : '0 0 28px rgb(147 197 253 / .4)',
        }}
      >
        Pontify
      </span>

      <motion.span
        className="pointer-events-none absolute inset-[-2px] -z-[1] rounded-lg bg-gradient-to-r from-transparent via-sky-500/12 to-transparent opacity-70"
        animate={reduce ? { opacity: 0.35 } : { opacity: [0.25, 0.55, 0.25] }}
        transition={reduce ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
