/**
 * Animações do Fy via CSS (GPU) — evita conflito com o loop de chroma do vídeo.
 */

'use client'

import { cn } from '@/lib/utils'
import type { FyMood } from '@/lib/fy-mascot'

interface FyMotionWrapperProps {
  children: React.ReactNode
  mood: FyMood
  isHovered?: boolean
  isClicked?: boolean
  className?: string
}

const MOOD_CLASS: Record<FyMood, string | undefined> = {
  neutro: undefined,
  alegria: 'fy-mood-celebrate',
  aviso: 'fy-mood-alert',
  atencao: undefined,
  entediado: 'fy-mood-bored',
  dormindo: 'fy-mood-sleeping',
}

export function FyMotionWrapper({
  children,
  mood,
  isHovered = false,
  isClicked = false,
  className,
}: FyMotionWrapperProps) {
  const moodClass = MOOD_CLASS[mood]

  return (
    <div
      className={cn(
        'fy-motion-root relative inline-block transform-gpu',
        moodClass,
        isHovered && 'fy-hover-active',
        isClicked && 'fy-click-active',
        className,
      )}
    >
      {children}
    </div>
  )
}
