import type { PontoConfig } from '@/lib/types'

/** Hora extra permitida sem justificativa (1h acima da meta diária). */
export const HORA_EXTRA_SEM_JUSTIFICATIVA_MINUTOS = 60

/** Limite em minutos: meta do dia + 1h — acima disso exige justificativa (ex.: 6h → pede a partir de 7h). */
export function getLimiteMinutosSemJustificativa(config: Pick<PontoConfig, 'metaDiariaMinutos'>): number {
  return config.metaDiariaMinutos + HORA_EXTRA_SEM_JUSTIFICATIVA_MINUTOS
}

export function precisaJustificativaHoraExtra(
  totalMinutos: number,
  config: Pick<PontoConfig, 'metaDiariaMinutos'>,
): boolean {
  return totalMinutos > getLimiteMinutosSemJustificativa(config)
}
