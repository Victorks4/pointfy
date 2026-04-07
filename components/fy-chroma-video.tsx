'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  FY_VIDEO_CROP_BOTTOM_RATIO,
  FY_VIDEO_CROP_LEFT_RATIO,
  FY_VIDEO_CROP_RIGHT_RATIO,
  FY_VIDEO_CROP_TOP_RATIO,
  isFyVideoBackgroundPixel,
  isFyVideoChromaEnabled,
} from '@/lib/fy-video-config'

type FyChromaVideoProps = {
  src: string
  className?: string
  canvasBaseWidth?: number
  /** Botão circular FAB: fundo branco no pai; vídeo dançando dentro do círculo. */
  layout?: 'default' | 'fab'
}

export function FyChromaVideo({ src, className, canvasBaseWidth = 280, layout = 'default' }: FyChromaVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chromaEnabled = isFyVideoChromaEnabled()
  const effectiveBaseWidth = layout === 'fab' ? Math.min(canvasBaseWidth, 132) : canvasBaseWidth

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.loop = true
    video.playsInline = true
    video.setAttribute('playsInline', '')

    const play = () => {
      void video.play().catch(() => {})
    }
    video.addEventListener('loadeddata', play)
    void video.play().catch(() => {})

    if (!chromaEnabled) {
      return () => {
        video.removeEventListener('loadeddata', play)
      }
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !ctx) {
      return () => {
        video.removeEventListener('loadeddata', play)
      }
    }

    let raf = 0
    let layoutReady = false
    let frameTick = 0
    const chromaEveryNthFrame = layout === 'fab' ? 2 : 1

    const applyLayout = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (vw < 2 || vh < 2) return
      const sx = vw * FY_VIDEO_CROP_LEFT_RATIO
      const sy = vh * FY_VIDEO_CROP_TOP_RATIO
      const sw = vw * (1 - FY_VIDEO_CROP_LEFT_RATIO - FY_VIDEO_CROP_RIGHT_RATIO)
      const sh = vh * (1 - FY_VIDEO_CROP_TOP_RATIO - FY_VIDEO_CROP_BOTTOM_RATIO)
      if (sw < 2 || sh < 2) return
      const ar = sw / sh
      canvas.width = effectiveBaseWidth
      canvas.height = Math.max(2, Math.round(effectiveBaseWidth / ar))
      layoutReady = true
    }

    video.addEventListener('loadedmetadata', applyLayout)

    const frame = () => {
      frameTick += 1
      const runChroma = frameTick % chromaEveryNthFrame === 0
      if (runChroma && layoutReady && video.readyState >= 2) {
        const vw = video.videoWidth
        const vh = video.videoHeight
        const sx = vw * FY_VIDEO_CROP_LEFT_RATIO
        const sy = vh * FY_VIDEO_CROP_TOP_RATIO
        const sw = vw * (1 - FY_VIDEO_CROP_LEFT_RATIO - FY_VIDEO_CROP_RIGHT_RATIO)
        const sh = vh * (1 - FY_VIDEO_CROP_TOP_RATIO - FY_VIDEO_CROP_BOTTOM_RATIO)
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data
        for (let i = 0; i < d.length; i += 4) {
          if (isFyVideoBackgroundPixel(d[i], d[i + 1], d[i + 2])) {
            d[i + 3] = 0
          }
        }
        ctx.putImageData(imageData, 0, 0)
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('loadeddata', play)
      video.removeEventListener('loadedmetadata', applyLayout)
    }
  }, [src, chromaEnabled, effectiveBaseWidth, layout])

  return (
    <div
      className={cn(
        layout === 'fab'
          ? 'relative flex h-[3.5rem] w-[3.5rem] shrink-0 items-end justify-center overflow-hidden rounded-full bg-white'
          : 'relative flex max-h-[min(42vh,240px)] w-[min(46vw,200px)] items-end justify-center sm:w-[min(40vw,220px)]',
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn(
          chromaEnabled
            ? 'pointer-events-none absolute h-px w-px opacity-0'
            : layout === 'fab'
              ? 'pointer-events-none h-full w-full -translate-x-2 scale-125 object-cover object-bottom'
              : 'h-full w-full rounded-2xl object-contain',
        )}
        loop
        muted
        playsInline
        autoPlay
        aria-hidden
      />
      {chromaEnabled ? (
        <canvas
          ref={canvasRef}
          className={cn(
            layout === 'fab'
              ? 'h-full max-h-[3.5rem] w-full max-w-[3.5rem] -translate-x-2 rounded-full object-cover object-bottom'
              : 'h-full max-h-[240px] w-auto max-w-full rounded-2xl object-contain',
          )}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
