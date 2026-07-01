import { isPresencaBloqueada } from '@/lib/presenca-bloqueio'
import { isUserInRecessPeriod } from '@/lib/time-utils'
import {
  compensacaoAfetaSaldo,
  minutosCompensacaoEfetivos,
} from '@/lib/compensacao-utils'
import type {
  PontoRegistro,
  Justificativa,
  BloqueioPresenca,
  User,
} from '@/lib/types'

export function calcularBancoHoras(
  user: User,
  pontos: PontoRegistro[],
  justificativas: Justificativa[],
  bloqueios: BloqueioPresenca[],
): number {
  const userPontos = pontos.filter(
    (p) =>
      p.userId === user.id &&
      !isPresencaBloqueada(bloqueios, user.id, p.data) &&
      !isUserInRecessPeriod(p.data, user),
  )
  const userJustificativas = justificativas.filter((j) => j.userId === user.id)

  const totalTrabalhado = userPontos.reduce((acc, p) => acc + p.totalMinutos, 0)
  const totalCompensado = userJustificativas
    .filter(
      (j) =>
        compensacaoAfetaSaldo(j) &&
        !isPresencaBloqueada(bloqueios, user.id, j.data) &&
        !isUserInRecessPeriod(j.data, user),
    )
    .reduce((acc, j) => acc + minutosCompensacaoEfetivos(j), 0)

  const diasTrabalhados = userPontos.length
  const cargaDiaria = user.cargaHorariaSemanal / 5
  const cargaEsperada = diasTrabalhados * cargaDiaria

  return totalTrabalhado - cargaEsperada + totalCompensado
}

export function calcularBancoHorasPorPeriodo(
  user: User,
  pontos: PontoRegistro[],
  justificativas: Justificativa[],
  bloqueios: BloqueioPresenca[],
  year: string,
  month: string,
): number {
  const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`
  const getYearMonthFromDate = (dateString: string) => dateString.slice(0, 7)

  const pontosNoPeriodo = pontos.filter(
    (p) =>
      p.userId === user.id &&
      getYearMonthFromDate(p.data) === yearMonthKey &&
      !isPresencaBloqueada(bloqueios, user.id, p.data) &&
      !isUserInRecessPeriod(p.data, user),
  )
  const justificativasNoPeriodo = justificativas.filter(
    (j) =>
      j.userId === user.id &&
      getYearMonthFromDate(j.data) === yearMonthKey &&
      !isPresencaBloqueada(bloqueios, user.id, j.data) &&
      !isUserInRecessPeriod(j.data, user),
  )

  const totalTrabalhado = pontosNoPeriodo.reduce((acc, p) => acc + p.totalMinutos, 0)
  const totalCompensado = justificativasNoPeriodo
    .filter((j) => compensacaoAfetaSaldo(j))
    .reduce((acc, j) => acc + minutosCompensacaoEfetivos(j), 0)

  const diasTrabalhados = pontosNoPeriodo.length
  const cargaDiaria = user.cargaHorariaSemanal / 5
  const cargaEsperada = diasTrabalhados * cargaDiaria

  return totalTrabalhado - cargaEsperada + totalCompensado
}
