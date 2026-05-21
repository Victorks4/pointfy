'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [y, m, d] = key.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function formatDateKeyBr(key: string): string {
  const { year, month, day } = parseDateKey(key)
  return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: { dateKey: string; day: number; inMonth: boolean }[] = []

  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ dateKey: toDateKey(y, m, day), day, inMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateKey: toDateKey(year, month, d), day: d, inMonth: true })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ dateKey: toDateKey(y, m, d), day: d, inMonth: false })
  }

  return cells
}

type CalendarPanelProps = {
  value: string
  onChange: (dateKey: string) => void
  maxDate?: string
  onSelect?: () => void
}

function CalendarPanel({ value, onChange, maxDate, onSelect }: CalendarPanelProps) {
  const parsed = value
    ? parseDateKey(value)
    : parseDateKey(toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
  const [viewYear, setViewYear] = useState(parsed.year)
  const [viewMonth, setViewMonth] = useState(parsed.month)

  const todayKey = useMemo(() => {
    const t = new Date()
    return toDateKey(t.getFullYear(), t.getMonth(), t.getDate())
  }, [])

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const goMonth = (delta: number) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    }
    if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  const pickToday = () => {
    const t = new Date()
    const key = toDateKey(t.getFullYear(), t.getMonth(), t.getDate())
    onChange(key)
    setViewYear(t.getFullYear())
    setViewMonth(t.getMonth())
    onSelect?.()
  }

  const monthLabel = `${MONTHS_PT[viewMonth]} ${viewYear}`

  return (
    <div className="w-[260px] overflow-hidden rounded-xl bg-gradient-to-b from-[#2d4a6e] via-[#243a58] to-[#1a2f47] p-2.5 shadow-lg shadow-[#16263a]/30">
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90 transition hover:bg-[#2f73e0]/30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="flex-1 truncate text-center text-xs font-semibold text-white">{monthLabel}</p>
        <button
          type="button"
          onClick={() => goMonth(1)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90 transition hover:bg-[#2f73e0]/30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5 border-b border-dashed border-white/15 pb-1">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={`${wd}-${i}`}
            className="py-0.5 text-center text-[10px] font-medium text-[#9db0c9]"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const isSelected = value === cell.dateKey
          const isToday = cell.dateKey === todayKey
          const isFuture = maxDate ? cell.dateKey > maxDate : false
          const disabled = !cell.inMonth || isFuture

          return (
            <button
              key={`${cell.dateKey}-${cell.inMonth}`}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  onChange(cell.dateKey)
                  onSelect?.()
                }
              }}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-all',
                cell.inMonth ? 'text-white' : 'text-[#5a7290]',
                disabled && 'cursor-not-allowed opacity-35',
                !disabled && !isSelected && 'hover:bg-white/10',
                isSelected && 'bg-[#2f73e0] text-white shadow-sm shadow-[#2f73e0]/50',
                isToday && !isSelected && 'ring-1 ring-[#ec4899]/80',
              )}
            >
              {cell.day}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex gap-1.5 border-t border-dashed border-white/15 pt-2">
        <button
          type="button"
          onClick={pickToday}
          className="flex-1 rounded-lg bg-[#ec4899] px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#db2777]"
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={pickToday}
          className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-white/90 transition hover:bg-white/15"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}

export type PontifyDatePickerProps = {
  value: string
  onChange: (dateKey: string) => void
  maxDate?: string
  id?: string
  className?: string
  placeholder?: string
}

/** Campo compacto + calendário Pontify em popover (fecha ao escolher a data). */
export function PontifyDatePicker({
  value,
  onChange,
  maxDate,
  id,
  className,
  placeholder = 'Selecione a data',
}: PontifyDatePickerProps) {
  const [open, setOpen] = useState(false)
  const display = value ? formatDateKeyBr(value) : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            'flex h-9 w-full max-w-[220px] items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs transition-colors',
            'hover:border-[#2f73e0]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f73e0]/40',
            open && 'border-[#2f73e0]/60 ring-2 ring-[#2f73e0]/30',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-[#2f73e0]" />
          <span className="truncate">{display}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <CalendarPanel
          value={value}
          onChange={onChange}
          maxDate={maxDate}
          onSelect={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

/** @deprecated Use PontifyDatePicker — mantido para compatibilidade. */
export function PontifyDateCalendar(props: PontifyDatePickerProps) {
  return <PontifyDatePicker {...props} />
}
