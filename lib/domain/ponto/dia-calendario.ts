import { RELATORIO_ANOTACAO } from '@/lib/constants/relatorio'
import { isUserInRecessPeriod } from '@/lib/domain/ponto/time-utils'
import type { Feriado, User } from '@/lib/types'

/** YYYY-MM-DD em horário local (meio-dia UTC evita virada de dia). */
export function parseDateKeyLocal(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function isWeekend(dateKey: string): boolean {
  const day = parseDateKeyLocal(dateKey).getDay()
  return day === 0 || day === 6
}

export function resolveFeriadoNoDia(dateKey: string, feriados: Feriado[]): Feriado | null {
  const mmdd = dateKey.slice(5)
  for (const f of feriados) {
    if (f.data === dateKey) return f
    if (f.recorrente && f.data.slice(5) === mmdd) return f
  }
  return null
}

export function getAnotacaoDiaNaoUtil(params: {
  dateKey: string
  feriados: Feriado[]
  user: User | null | undefined
}): string | null {
  const { dateKey, feriados, user } = params

  const feriado = resolveFeriadoNoDia(dateKey, feriados)
  if (feriado) return RELATORIO_ANOTACAO.FERIADO(feriado.nome)

  if (user && isUserInRecessPeriod(dateKey, user)) {
    return RELATORIO_ANOTACAO.RECESSO
  }

  if (isWeekend(dateKey)) {
    const dow = parseDateKeyLocal(dateKey).getDay()
    return dow === 6
      ? RELATORIO_ANOTACAO.FIM_DE_SEMANA_SABADO
      : RELATORIO_ANOTACAO.FIM_DE_SEMANA_DOMINGO
  }

  return null
}
