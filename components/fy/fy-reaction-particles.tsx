/**
 * Fy Reaction Particles - Partículas de celebração
 * Renderiza partículas animadas quando o Fy celebra
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FyReactionParticlesProps {
  active?: boolean
  className?: string
}

export function FyReactionParticles({ active = false, className }: FyReactionParticlesProps) {
  if (!active) return null

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-visible', className)}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="fy-celebrate-particle"
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: -30 - i * 10,
            opacity: 0,
            scale: 0.5,
            x: (i - 2) * 8,
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
          style={{
            left: `${20 + i * 15}%`,
            top: '10%',
            background: `linear-gradient(135deg, ${getParticleColor(i)}, ${getParticleColor(i, true)})`,
          }}
        />
      ))}
    </div>
  )
}

function getParticleColor(index: number, darker = false): string {
  const colors = [
    { light: '#fbbf24', dark: '#f59e0b' },
    { light: '#34d399', dark: '#10b981' },
    { light: '#60a5fa', dark: '#3b82f6' },
    { light: '#f472b6', dark: '#ec4899' },
    { light: '#a78bfa', dark: '#8b5cf6' },
  ]
  const color = colors[index % colors.length]
  return darker ? color.dark : color.light
}
