/**
 * Z's animados quando dormindo — CSS puro.
 */

'use client'

import { cn } from '@/lib/utils'

interface FySleepZProps {
  active?: boolean
  className?: string
}

export function FySleepZ({ active = false, className }: FySleepZProps) {
  if (!active) return null

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-visible', className)}
      aria-hidden
    >
      <span className="fy-sleep-z">Z</span>
      <span className="fy-sleep-z">Z</span>
      <span className="fy-sleep-z">Z</span>
    </div>
  )
}
