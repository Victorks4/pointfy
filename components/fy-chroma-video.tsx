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
}

export function FyChromaVideo({ src, className, canvasBaseWidth = 280 }: FyChromaVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chromaEnabled = isFyVideoChromaEnabled()

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
      canvas.width = canvasBaseWidth
      canvas.height = Math.max(2, Math.round(canvasBaseWidth / ar))
      layoutReady = true
    }

    video.addEventListener('loadedmetadata', applyLayout)

    const frame = () => {
      if (layoutReady && video.readyState >= 2) {
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
  }, [src, chromaEnabled, canvasBaseWidth])

  return (
    <div
      className={cn(
        'relative flex max-h-[min(42vh,240px)] w-[min(46vw,200px)] items-end justify-center sm:w-[min(40vw,220px)]',
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn(
          chromaEnabled ? 'pointer-events-none absolute h-px w-px opacity-0' : 'h-full w-full rounded-2xl object-contain',
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
          className="h-full max-h-[240px] w-auto max-w-full rounded-2xl object-contain"
          aria-hidden
        />
      ) : null}
    </div>
  )
}
