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
  
  // Não aceitar horários "fechados" (00 minutos)
  // DESABILITADO: se quiser habilitar, descomente a linha abaixo
  // if (minutes === 0) return false
  
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
  
  const check = new Date(checkDate)
  const start = new Date(recessStart)
  const end = new Date(recessEnd)
  
  return check >= start && check <= end
}

/**
 * Calcula a data de fim do recesso (15 dias após o início)
 */
export function calculateRecessEnd(startDate: string): string {
  const start = new Date(startDate)
  start.setDate(start.getDate() + 15)
  return start.toISOString().split('T')[0]
}

/**
 * Verifica se o recesso está próximo (dentro de 7 dias)
 */
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
