/**
 * Fy Motion Wrapper - Wrapper Framer Motion com animações
 * Envolve o vídeo do Fy com animações baseadas no estado
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { FyMood } from '@/lib/fy-mascot'

interface FyMotionWrapperProps {
  children: React.ReactNode
  mood: FyMood
  isHovered?: boolean
  isClicked?: boolean
  className?: string
}

const moodVariants = {
  neutro: {
    scale: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  alegria: {
    scale: [1, 1.05, 1, 1.03, 1],
    y: [0, -8, 0, -6, 0],
    transition: { duration: 0.8 },
  },
  aviso: {
    x: [0, -4, 4, -4, 4, -3, 3, 0],
    rotate: [0, -2, 2, -2, 2, -1, 1, 0],
    transition: { duration: 0.4 },
  },
  atencao: {
    scale: 1,
    transition: { duration: 0.2 },
  },
  entediado: {
    y: [0, 3, -2, 0],
    rotate: [0, -2, 1, 0],
    transition: { duration: 2.5, repeat: Infinity },
  },
  dormindo: {
    scale: [1, 1.02, 1],
    opacity: [0.9, 1, 0.9],
    transition: { duration: 3, repeat: Infinity },
  },
}

const hoverVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export function FyMotionWrapper({
  children,
  mood,
  isHovered = false,
  isClicked = false,
  className,
}: FyMotionWrapperProps) {
  return (
    <motion.div
      className={cn('relative inline-block', className, isClicked && 'fy-click-active')}
      variants={moodVariants}
      animate={mood}
      initial="neutro"
      whileHover={isHovered ? 'hover' : undefined}
    >
      {children}
    </motion.div>
  )
}
