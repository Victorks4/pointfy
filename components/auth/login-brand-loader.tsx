'use client'

import { motion, useReducedMotion } from 'framer-motion'

/** Loader do login: traço do P desenhando + barra preenchida estilo onda */
export function LoginBrandLoader() {
  const reduce = useReducedMotion()

  return (
    <span className="inline-flex items-center gap-3">
      <svg width="30" height="30" viewBox="0 0 32 32" className="shrink-0" aria-hidden>
        <motion.path
          d="M9 26 L9 6 M9 14 L17.5 14 Q24.5 14 24.5 21 Q24.5 26 17.5 26 L9 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
          initial={reduce ? false : { pathLength: 0 }}
          animate={reduce ? { pathLength: 1 } : { pathLength: [0, 1, 1, 0] }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.42, 0.58, 1],
                }
          }
        />
      </svg>
      <span className="relative flex h-5 w-[4.25rem] overflow-hidden rounded-full border border-white/25 bg-white/10">
        <motion.span
          className="absolute inset-x-0 bottom-0 rounded-t-full bg-gradient-to-t from-cyan-300/90 via-sky-400/75 to-blue-500/40"
          initial={reduce ? false : { height: '0%' }}
          animate={reduce ? { height: '55%' } : { height: ['5%', '100%', '8%', '100%', '5%'] }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 2.1,
                  repeat: Infinity,
                  ease: [0.45, 0, 0.55, 1],
                }
          }
          style={{ width: '100%' }}
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </span>
    </span>
  )
}
