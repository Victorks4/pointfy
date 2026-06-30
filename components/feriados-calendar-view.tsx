'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Palmtree } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/time-utils'
import type { Feriado, FeriadoTipo } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

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

const TIPO_LABELS: Record<FeriadoTipo, string> = {
  nacional: 'Nacional',
  municipal: 'Municipal',
  empresa: 'Empresa',
}

const TIPO_BADGE: Record<FeriadoTipo, string> = {
  nacional: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  municipal: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  empresa: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

function formatDateShort(dateString: string): string {
  const [y, m, d] = dateString.split('-')
  return `${d}/${m}/${y}`
}

function recessoStatus(inicio: string, fim: string): 'futuro' | 'ativo' | 'passado' {
  const today = new Date().toISOString().split('T')[0]
  if (today < inicio) return 'futuro'
  if (today > fim) return 'passado'
  return 'ativo'
}

const RECESSO_STATUS_LABEL = {
  futuro: { text: 'Agendado', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  ativo: { text: 'Em andamento', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  passado: { text: 'Encerrado', className: 'bg-muted text-muted-foreground' },
} as const

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
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

type RecessoPeriodo = {
  numero: 1 | 2
  inicio: string
  fim: string
}

type FeriadosCalendarViewProps = {
  feriados: Feriado[]
  recessos?: RecessoPeriodo[]
}

export function FeriadosCalendarView({ feriados, recessos = [] }: FeriadosCalendarViewProps) {  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [recessoOpen, setRecessoOpen] = useState(false)

  const feriadoByDate = useMemo(() => {
    const map = new Map<string, Feriado>()
    for (const f of feriados) map.set(f.data, f)
    return map
  }, [feriados])

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const feriadosDoMes = useMemo(
    () =>
      feriados
        .filter((f) => {
          const [y, m] = f.data.split('-').map(Number)
          return y === viewYear && m === viewMonth + 1
        })
        .sort((a, b) => a.data.localeCompare(b.data)),
    [feriados, viewYear, viewMonth],
  )

  const selectedFeriado = selectedDate ? feriadoByDate.get(selectedDate) : null
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

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
    setSelectedDate(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-xl border bg-gradient-to-b from-[#2d4a6e] via-[#243a58] to-[#1a2f47] p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90 transition hover:bg-[#2f73e0]/30"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h3 className="text-lg font-semibold text-white">
            {MONTHS_PT[viewMonth]} {viewYear}
          </h3>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90 transition hover:bg-[#2f73e0]/30"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-1 text-center text-xs font-medium text-[#9db0c9]">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const feriado = feriadoByDate.get(cell.dateKey)
            const isSelected = selectedDate === cell.dateKey
            const isToday = cell.dateKey === todayKey

            return (
              <button
                key={`${cell.dateKey}-${cell.inMonth}`}
                type="button"
                disabled={!cell.inMonth}
                onClick={() => cell.inMonth && setSelectedDate(cell.dateKey)}
                title={feriado?.nome}
                className={cn(
                  'relative flex min-h-12 flex-col items-center justify-center rounded-lg p-1 text-sm font-medium transition-all',
                  cell.inMonth ? 'text-white' : 'text-[#5a7290] cursor-default',
                  !cell.inMonth && 'opacity-40',
                  cell.inMonth && !isSelected && 'hover:bg-white/10',
                  isSelected && 'bg-[#2f73e0] text-white shadow-sm shadow-[#2f73e0]/50',
                  isToday && !isSelected && 'ring-1 ring-[#ec4899]/80',
                  feriado && !isSelected && 'bg-amber-500/25 text-amber-100',
                )}
              >
                <span>{cell.day}</span>
                {feriado && cell.inMonth ? (
                  <span className="mt-0.5 line-clamp-1 w-full truncate text-[9px] font-normal opacity-90">
                    {feriado.nome.split(' ')[0]}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-dashed border-white/15 pt-3 text-xs text-[#9db0c9]">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-500/40" />
            Feriado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded ring-1 ring-[#ec4899]/80" />
            Hoje
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {selectedFeriado ? (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Data selecionada</p>
            <p className="text-lg font-semibold">{formatDate(selectedFeriado.data)}</p>
            <p className="mt-2 font-medium">{selectedFeriado.nome}</p>
            <Badge className={cn('mt-2', TIPO_BADGE[selectedFeriado.tipo])}>
              {TIPO_LABELS[selectedFeriado.tipo]}
            </Badge>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Clique em um dia do calendário para ver os detalhes.
          </div>
        )}

        <div className="rounded-xl border bg-card p-4">
          <h4 className="mb-3 font-semibold">
            Feriados em {MONTHS_PT[viewMonth]}
          </h4>
          {feriadosDoMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum feriado neste mês.</p>
          ) : (
            <ul className="space-y-2">
              {feriadosDoMes.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(f.data)}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      selectedDate === f.data && 'bg-muted',
                    )}
                  >
                    <span className="font-medium">{formatDate(f.data)}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.nome}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <button
            type="button"
            aria-expanded={recessoOpen}
            onClick={() => setRecessoOpen((open) => !open)}
            className={cn(
              'flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition-colors',
              recessoOpen
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-transparent hover:bg-muted/40',
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Palmtree className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Recesso remunerado
              </span>
              <span className="block text-xs text-muted-foreground">
                {recessos.length > 0
                  ? `${recessos.length} período${recessos.length > 1 ? 's' : ''} cadastrado${recessos.length > 1 ? 's' : ''}`
                  : 'Consultar datas do seu perfil'}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                recessoOpen && 'rotate-180',
              )}
            />
          </button>

          {recessoOpen ? (
            <div className="space-y-2.5 p-4">
              {recessos.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                  Nenhum recesso remunerado cadastrado no seu perfil.
                </p>
              ) : (
                recessos.map((r) => {
                  const status = recessoStatus(r.inicio, r.fim)
                  const badge = RECESSO_STATUS_LABEL[status]
                  return (
                    <div
                      key={r.numero}
                      className="rounded-lg border border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 to-transparent px-3.5 py-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Recesso {r.numero}</p>
                        <Badge variant="secondary" className={badge.className}>
                          {badge.text}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{formatDateShort(r.inicio)}</span>
                        <span className="mx-1.5 text-muted-foreground">→</span>
                        <span className="font-medium">{formatDateShort(r.fim)}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(r.inicio)} até {formatDate(r.fim)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
