'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useFy } from '@/lib/fy-context'
import { FyCanvas } from '@/components/fy/fy-canvas'
import { WebGlErrorBoundary } from '@/components/fy/webgl-error-boundary'

export type FyMascot3dVariant = 'fab' | 'tour'

const VARIANT_CONFIG: Record<
  FyMascot3dVariant,
  { wrapperClass: string; cameraZoom: number; fallbackSize: number; rounded: string }
> = {
  fab: {
    wrapperClass: 'h-[52px] w-[52px]',
    cameraZoom: 120,
    fallbackSize: 44,
    rounded: 'rounded-full',
  },
  tour: {
    wrapperClass: 'h-24 w-24 sm:h-28 sm:w-28',
    cameraZoom: 200,
    fallbackSize: 112,
    rounded: 'rounded-2xl',
  },
}

export type FyMascot3dProps = {
  variant?: FyMascot3dVariant
  className?: string
}

export function FyMascot3d({ variant = 'fab', className }: FyMascot3dProps) {
  const { animationPhase, pointAngleRad, celebrateNonce } = useFy()
  const cfg = VARIANT_CONFIG[variant]

  const fallback = (
    <Image
      src="/fy-mascote.png"
      alt=""
      width={cfg.fallbackSize}
      height={cfg.fallbackSize}
      className="object-contain p-1"
    />
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-primary/10 ring-1 ring-primary/20',
        cfg.rounded,
        cfg.wrapperClass,
        className,
      )}
    >
      <WebGlErrorBoundary fallback={fallback}>
        <FyCanvas
          phase={animationPhase}
          pointAngleRad={pointAngleRad}
          celebrateNonce={celebrateNonce}
          cameraZoom={cfg.cameraZoom}
        />
      </WebGlErrorBoundary>
    </div>
  )
}
