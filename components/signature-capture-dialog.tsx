'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eraser, ImagePlus } from 'lucide-react'

const CANVAS_W = 560
const CANVAS_H = 200

type SignatureCaptureDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSave: (dataUrl: string) => void
}

function getPointerPos(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

export function SignatureCaptureDialog({
  open,
  onOpenChange,
  title,
  description,
  onSave,
}: SignatureCaptureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasStroke, setHasStroke] = useState(false)

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    setHasStroke(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = requestAnimationFrame(() => {
      clearCanvas()
    })
    return () => cancelAnimationFrame(t)
  }, [open, clearCanvas])

  const startLine = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawing.current = true
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

  const drawLine = useCallback((x: number, y: number) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasStroke(true)
  }, [])

  const endLine = useCallback(() => {
    drawing.current = false
  }, [])

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') return
        const img = new Image()
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
          const scale = Math.min((CANVAS_W - 8) / img.width, (CANVAS_H - 8) / img.height, 1)
          const dw = img.width * scale
          const dh = img.height * scale
          const ox = (CANVAS_W - dw) / 2
          const oy = (CANVAS_H - dh) / 2
          ctx.drawImage(img, ox, oy, dw, dh)
          setHasStroke(true)
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    },
    [],
  )

  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasStroke) return
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
    onOpenChange(false)
  }, [hasStroke, onOpenChange, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
              <Eraser className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Usar foto
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={onFileChange}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Desenhe com o mouse ou toque; ou importe uma foto da sua assinatura em fundo claro.
            </Label>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full max-h-36 touch-none cursor-crosshair rounded-md border-2 border-zinc-400 bg-white"
              onMouseDown={(e) => {
                const { x, y } = getPointerPos(e.currentTarget, e.clientX, e.clientY)
                startLine(x, y)
              }}
              onMouseMove={(e) => {
                const { x, y } = getPointerPos(e.currentTarget, e.clientX, e.clientY)
                drawLine(x, y)
              }}
              onMouseUp={endLine}
              onMouseLeave={endLine}
              onTouchStart={(e) => {
                e.preventDefault()
                const touch = e.touches[0]
                if (!touch) return
                const { x, y } = getPointerPos(e.currentTarget, touch.clientX, touch.clientY)
                startLine(x, y)
              }}
              onTouchMove={(e) => {
                e.preventDefault()
                const touch = e.touches[0]
                if (!touch) return
                const { x, y } = getPointerPos(e.currentTarget, touch.clientX, touch.clientY)
                drawLine(x, y)
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                endLine()
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!hasStroke}>
            Salvar assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
