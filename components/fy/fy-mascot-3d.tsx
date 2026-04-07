'use client'

import Image from 'next/image'
import { FyCanvas } from '@/components/fy/fy-canvas'
import { WebGlErrorBoundary } from '@/components/fy/webgl-error-boundary'

/** Mantido para referência; o pet ativo no app usa vídeo (`FyChromaVideo`). */
export function FyMascot3d() {
  const fallback = (
    <Image src="/fy-mascote.png" alt="" width={44} height={44} className="object-contain p-0.5" />
  )

  return (
    <div className="relative h-[52px] w-[52px] overflow-hidden rounded-full bg-primary-foreground/10">
      <WebGlErrorBoundary fallback={fallback}>
        <FyCanvas phase="idle" pointAngleRad={0} celebrateNonce={0} />
      </WebGlErrorBoundary>
    </div>
  )
}
