'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

function digitsOnly(raw: string, max = 4) {
  return raw.replace(/\D/g, '').slice(0, max)
}

function formatPartial(digits: string): string {
  if (!digits) return ''
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function digitsToValue(digits: string): string {
  if (digits.length !== 4) return ''
  const h = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

type TimeFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimeField({ id, value, onChange, className }: TimeFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(() => (value ? value : ''))
  useEffect(() => {
    setText(value ? value : '')
  }, [value])

  const commit = useCallback(
    (digits: string) => {
      const formatted = formatPartial(digits)
      setText(formatted)
      onChange(digitsToValue(digits))
    },
    [onChange],
  )

  const handleChange = (raw: string) => {
    const digits = digitsOnly(raw)
    commit(digits)
  }

  const handleBlur = () => {
    const digits = digitsOnly(text)
    if (digits.length > 0 && digits.length < 4) {
      setText('')
      onChange('')
      return
    }
    if (digits.length === 4) {
      const v = digitsToValue(digits)
      setText(v)
      onChange(v)
    }
  }

  return (
    <div
      className={cn(
        'relative flex w-full items-center rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-[border-color,box-shadow]',
        'focus-within:border-ring/80 focus-within:ring-2 focus-within:ring-primary/10',
        className,
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="00:00"
        aria-label="Horário"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent pr-10 text-left text-lg font-semibold tabular-nums outline-none',
          'placeholder:font-semibold placeholder:text-muted-foreground/35',
          'text-foreground',
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Focar horário"
        className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/55 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={() => inputRef.current?.focus()}
      >
        <Clock className="h-5 w-5 stroke-[1.5]" />
      </button>
    </div>
  )
}
