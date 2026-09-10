'use client'

import { memo, useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Relógio ao vivo isolado — só este componente re-renderiza a cada segundo. */
function LiveClockInner({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={
        className ??
        'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-sm'
      }
    >
      <Timer className="h-4 w-4 text-primary" />
      <span className="font-mono text-primary font-medium">{formatTime(now)}</span>
    </div>
  )
}

export const LiveClock = memo(LiveClockInner)
