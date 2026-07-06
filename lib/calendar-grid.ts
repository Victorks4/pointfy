/** Grade de calendário mensal — semana começa no domingo (padrão BR visual: D S T Q Q S S). */

export type CalendarCell = {
  dateKey: string
  day: number
  inMonth: boolean
}

export function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalendarCell[] = []

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

/** Índice da coluna (0=dom … 6=sáb) para uma data YYYY-MM-DD no fuso local. */
export function weekdayColumnForDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}
