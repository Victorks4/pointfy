import type { User } from '@/lib/types'

export type RecessoPeriodoCadastrado = {
  numero: 1 | 2
  inicio: string
  fim: string
}

export type UserRecessoFields = Pick<
  User,
  'dataInicioRecesso1' | 'dataFimRecesso1' | 'dataInicioRecesso2' | 'dataFimRecesso2'
>

/** Períodos de recesso com início e fim completos (como cadastrados no perfil). */
export function listRecessoPeriodos(user: UserRecessoFields): RecessoPeriodoCadastrado[] {
  const periods: RecessoPeriodoCadastrado[] = []
  if (user.dataInicioRecesso1 && user.dataFimRecesso1) {
    periods.push({
      numero: 1,
      inicio: user.dataInicioRecesso1,
      fim: user.dataFimRecesso1,
    })
  }
  if (user.dataInicioRecesso2 && user.dataFimRecesso2) {
    periods.push({
      numero: 2,
      inicio: user.dataInicioRecesso2,
      fim: user.dataFimRecesso2,
    })
  }
  return periods
}
