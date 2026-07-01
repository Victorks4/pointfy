// Utilitários para manipulação de tempo

/**
 * Converte horário HH:mm para minutos
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converte minutos para formato HH:mm
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : ''
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Formata minutos para exibição (ex: 6h 30min)
 */
export function formatMinutesToDisplay(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : ''
  
  if (hours === 0) {
    return `${sign}${mins}min`
  }
  if (mins === 0) {
    return `${sign}${hours}h`
  }
  return `${sign}${hours}h ${mins}min`
}

/** Converte horas informadas pelo usuário (aceita vírgula) em minutos. */
export function parseHorasToMinutos(horasInput: string): number | null {
  const normalized = horasInput.trim().replace(',', '.')
  if (!normalized) return null
  const horas = Number(normalized)
  if (!Number.isFinite(horas) || horas <= 0) return null
  return Math.round(horas * 60)
}

/**
 * Valida se o horário não é "fechado" (minutos != 00)
 */
export function isValidTimeFormat(time: string): boolean {
  const parts = time.split(':')
  if (parts.length !== 2) return false

  const [hours, minutes] = parts.map(Number)

  if (isNaN(hours) || isNaN(minutes)) return false
  if (hours < 0 || hours > 23) return false
  if (minutes < 0 || minutes > 59) return false

  return true
}

/** Horário com minutos exatamente :00 (regra "não fechado"). */
export function hasClosedMinutes(time: string): boolean {
  const parts = time.split(':')
  if (parts.length !== 2) return false
  const minutes = Number(parts[1])
  return Number.isFinite(minutes) && minutes === 0
}

export function isValidTimeFormatStrict(time: string, rejeitarMinutosZero: boolean): boolean {
  if (!isValidTimeFormat(time)) return false
  if (rejeitarMinutosZero && hasClosedMinutes(time)) return false
  return true
}

/**
 * Calcula o total de minutos trabalhados no dia
 */
export function calculateDayTotal(
  entrada1: string | null,
  saida1: string | null,
  entrada2: string | null,
  saida2: string | null
): number {
  let total = 0
  
  if (entrada1 && saida1) {
    total += timeToMinutes(saida1) - timeToMinutes(entrada1)
  }
  
  if (entrada2 && saida2) {
    total += timeToMinutes(saida2) - timeToMinutes(entrada2)
  }
  
  return Math.max(0, total)
}

/**
 * Valida se a saída é depois da entrada
 */
export function isValidTimeSequence(entrada: string, saida: string): boolean {
  return timeToMinutes(saida) > timeToMinutes(entrada)
}

/**
 * Valida se não há sobreposição entre os períodos
 */
export function isValidNonOverlapping(
  saida1: string,
  entrada2: string
): boolean {
  return timeToMinutes(entrada2) >= timeToMinutes(saida1)
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Verifica se uma data está dentro do período de recesso
 */
export function isInRecessPeriod(
  checkDate: string,
  recessStart: string | null,
  recessEnd: string | null
): boolean {
  if (!recessStart || !recessEnd) return false

  return checkDate >= recessStart && checkDate <= recessEnd
}

/** Verifica recesso 1 ou 2 do usuário. */
export function isUserInRecessPeriod(
  checkDate: string,
  user: {
    dataInicioRecesso1: string | null
    dataFimRecesso1: string | null
    dataInicioRecesso2: string | null
    dataFimRecesso2: string | null
  },
): boolean {
  return (
    isInRecessPeriod(checkDate, user.dataInicioRecesso1, user.dataFimRecesso1) ||
    isInRecessPeriod(checkDate, user.dataInicioRecesso2, user.dataFimRecesso2)
  )
}

export function isRecessApproaching(
  recessStart: string | null,
  daysAhead: number = 7
): boolean {
  if (!recessStart) return false
  
  const today = new Date()
  const start = new Date(recessStart)
  const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 && diffDays <= daysAhead
}

/** Algum recesso do usuário começa em até N dias. */
export function isAnyRecessApproaching(
  user: {
    dataInicioRecesso1: string | null
    dataInicioRecesso2: string | null
  },
  daysAhead: number = 7,
): boolean {
  return (
    isRecessApproaching(user.dataInicioRecesso1, daysAhead) ||
    isRecessApproaching(user.dataInicioRecesso2, daysAhead)
  )
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function toLocalMidnight(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`)
}

export function calcularSequenciaAtual(dates: string[]): number {
  if (dates.length === 0) return 0

  const today = toLocalMidnight(getTodayString())
  const uniqueDates = [...new Set(dates)]
    .sort((a, b) => toLocalMidnight(b).getTime() - toLocalMidnight(a).getTime())

  const mostRecent = toLocalMidnight(uniqueDates[0])
  const daysSinceLast = Math.round((today.getTime() - mostRecent.getTime()) / MS_PER_DAY)

  if (daysSinceLast > 1) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = toLocalMidnight(uniqueDates[i - 1])
    const curr = toLocalMidnight(uniqueDates[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / MS_PER_DAY)
    if (diff !== 1) break
    streak++
  }
  return streak
}
