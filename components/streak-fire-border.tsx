'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const SPARKS = [
  { className: 'streak-fire-spark streak-fire-spark-1', style: { top: '4%', left: '18%' } },
  { className: 'streak-fire-spark streak-fire-spark-2', style: { top: '8%', right: '14%' } },
  { className: 'streak-fire-spark streak-fire-spark-3', style: { bottom: '12%', left: '8%' } },
  { className: 'streak-fire-spark streak-fire-spark-4', style: { bottom: '10%', right: '10%' } },
  { className: 'streak-fire-spark streak-fire-spark-5', style: { top: '42%', left: '2%' } },
  { className: 'streak-fire-spark streak-fire-spark-6', style: { top: '38%', right: '2%' } },
] as const

type StreakFireBorderProps = React.ComponentPropsWithoutRef<'div'> & {
  active: boolean
}

export function StreakFireBorder({
  active,
  className,
  children,
  ...props
}: StreakFireBorderProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl',
        active ? 'neon-card-streak-fire' : 'neon-card-streak',
        className,
      )}
      {...props}
    >
      {active &&
        SPARKS.map((spark, index) => (
          <span
            key={index}
            className={cn('pointer-events-none absolute z-20 flex text-orange-400', spark.className)}
            style={spark.style}
            aria-hidden
          >
            <Flame className="h-3.5 w-3.5 drop-shadow-[0_0_6px_rgba(249,115,22,0.9)]" />
          </span>
        ))}
      {children}
    </div>
  )
}
