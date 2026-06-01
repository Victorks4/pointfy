/**
 * Partículas de celebração — CSS puro (sem Framer Motion).
 */

'use client'

import { cn } from '@/lib/utils'

interface FyReactionParticlesProps {
  active?: boolean
  className?: string
}

export function FyReactionParticles({ active = false, className }: FyReactionParticlesProps) {
  if (!active) return null

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-visible', className)}
      aria-hidden
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="fy-celebrate-particle" />
      ))}
    </div>
  )
}
