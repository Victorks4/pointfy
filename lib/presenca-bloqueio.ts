import type { BloqueioPresenca } from '@/lib/types'

export function dateKeyInRange(
  dateKey: string,
  inicio: string,
  fim: string | null,
): boolean {
  if (dateKey < inicio) return false
  if (fim === null) return dateKey === inicio
  return dateKey >= inicio && dateKey <= fim
}

export function isPresencaBloqueada(
  bloqueios: BloqueioPresenca[],
  userId: string,
  data: string,
): boolean {
  return bloqueios.some((b) => {
    const applies = b.userId === null || b.userId === userId
    if (!applies) return false
    return dateKeyInRange(data, b.dataInicio, b.dataFim)
  })
}
