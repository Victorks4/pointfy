/**
 * Fy Sleep Z - Z's animados quando dormindo
 * Renderiza Z's flutuantes ao redor do Fy quando está dormindo
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FySleepZProps {
  active?: boolean
  className?: string
}

export function FySleepZ({ active = false, className }: FySleepZProps) {
  if (!active) return null

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-visible', className)}>
      <motion.span
        className="fy-sleep-z"
        style={{ right: '20%', top: '10%' }}
        initial={{ y: 0, opacity: 0, scale: 0.5 }}
        animate={{ y: -20, opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
      >
        Z
      </motion.span>
      <motion.span
        className="fy-sleep-z"
        style={{ right: '35%', top: '5%' }}
        initial={{ y: 0, opacity: 0, scale: 0.5 }}
        animate={{ y: -20, opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
      >
        Z
      </motion.span>
      <motion.span
        className="fy-sleep-z"
        style={{ right: '25%', top: '15%' }}
        initial={{ y: 0, opacity: 0, scale: 0.5 }}
        animate={{ y: -20, opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1.6 }}
      >
        Z
      </motion.span>
    </div>
  )
}
