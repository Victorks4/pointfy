'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
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
  /** Quando false, pausa processamento chroma (ex.: dock oculto). */
  playbackActive?: boolean
  /** Menos frames de chroma quando o mascote está parado. */
  chromaLoad?: 'low' | 'normal'
}

function getChromaInterval(layout: 'default' | 'fab', chromaLoad: 'low' | 'normal') {
  if (layout === 'fab') return chromaLoad === 'low' ? 4 : 3
  return chromaLoad === 'low' ? 3 : 2
}

export function FyChromaVideo({
  src,
  className,
  canvasBaseWidth = 200,
  layout = 'default',
  playbackActive = true,
  chromaLoad = 'normal',
}: FyChromaVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chromaLoadRef = useRef(chromaLoad)
  const shouldPlayRef = useRef(false)
  const chromaEnabled = isFyVideoChromaEnabled()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [pageVisible, setPageVisible] = useState(true)
  const [inView, setInView] = useState(true)
  const effectiveBaseWidth = layout === 'fab' ? Math.min(canvasBaseWidth, 112) : canvasBaseWidth

  const shouldPlay = playbackActive && !prefersReducedMotion && pageVisible && inView

  chromaLoadRef.current = chromaLoad
  shouldPlayRef.current = shouldPlay

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '96px', threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.loop = true
    video.playsInline = true
    video.setAttribute('playsinline', '')

    const ensurePlaying = () => {
      if (!shouldPlayRef.current) return
      if (video.ended) video.currentTime = 0
      if (video.paused) void video.play().catch(() => {})
    }

    const onVisibilityResume = () => {
      if (document.visibilityState === 'visible') ensurePlaying()
    }

    const onPause = () => {
      if (shouldPlayRef.current) requestAnimationFrame(ensurePlaying)
    }

    video.addEventListener('pause', onPause)
    video.addEventListener('ended', ensurePlaying)
    video.addEventListener('stalled', ensurePlaying)
    video.addEventListener('waiting', ensurePlaying)
    document.addEventListener('visibilitychange', onVisibilityResume)

    const watchdog = window.setInterval(ensurePlaying, 2000)

    if (shouldPlay) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }

    return () => {
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', ensurePlaying)
      video.removeEventListener('stalled', ensurePlaying)
      video.removeEventListener('waiting', ensurePlaying)
      document.removeEventListener('visibilitychange', onVisibilityResume)
      window.clearInterval(watchdog)
    }
  }, [shouldPlay, src])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !chromaEnabled) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return

    let raf = 0
    let layoutReady = false
    let frameTick = 0
    let lastProcessedTime = -1

    const applyLayout = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (vw < 2 || vh < 2) return
      const sw = vw * (1 - FY_VIDEO_CROP_LEFT_RATIO - FY_VIDEO_CROP_RIGHT_RATIO)
      const sh = vh * (1 - FY_VIDEO_CROP_TOP_RATIO - FY_VIDEO_CROP_BOTTOM_RATIO)
      if (sw < 2 || sh < 2) return
      const ar = sw / sh
      canvas.width = effectiveBaseWidth
      canvas.height = Math.max(2, Math.round(effectiveBaseWidth / ar))
      layoutReady = true
    }

    video.addEventListener('loadedmetadata', applyLayout)
    if (video.readyState >= 1) applyLayout()

    const processChromaFrame = () => {
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

    const frame = () => {
      if (!shouldPlayRef.current) {
        raf = 0
        return
      }

      frameTick += 1
      const videoTime = video.currentTime
      const chromaInterval = getChromaInterval(layout, chromaLoadRef.current)
      const runChroma =
        frameTick % chromaInterval === 0 &&
        videoTime !== lastProcessedTime &&
        layoutReady &&
        video.readyState >= 2 &&
        !video.paused

      if (runChroma) {
        lastProcessedTime = videoTime
        processChromaFrame()
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('loadedmetadata', applyLayout)
    }
  }, [chromaEnabled, effectiveBaseWidth, layout, shouldPlay, src])

  return (
    <div
      ref={containerRef}
      className={cn(
        'fy-chroma-shell',
        layout === 'fab'
          ? 'relative flex h-[3.5rem] w-[3.5rem] shrink-0 items-end justify-center overflow-hidden rounded-full bg-white'
          : 'relative flex max-h-[min(42vh,240px)] w-[min(46vw,200px)] items-end justify-center sm:w-[min(40vw,220px)]',
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        className={cn(
          chromaEnabled
            ? 'pointer-events-none absolute inset-0 h-full w-full opacity-0'
            : layout === 'fab'
              ? 'pointer-events-none h-full w-full -translate-x-2 scale-125 object-cover object-bottom'
              : 'h-full w-full rounded-2xl object-contain',
        )}
        loop
        muted
        playsInline
        autoPlay={shouldPlay}
        aria-hidden
      />
      {chromaEnabled ? (
        <canvas
          ref={canvasRef}
          className={cn(
            'fy-chroma-canvas',
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
