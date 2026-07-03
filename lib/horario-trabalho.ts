import { isValidNonOverlapping, isValidTimeFormat, isValidTimeSequence } from '@/lib/time-utils'

export const HORARIO_TRABALHO_PADRAO = {
  entrada1: '08:00',
  saida1: '12:00',
  entrada2: '13:00',
  saida2: '17:00',
} as const

export type HorarioTrabalho = {
  horarioTrabalhoEntrada1: string | null
  horarioTrabalhoSaida1: string | null
  horarioTrabalhoEntrada2: string | null
  horarioTrabalhoSaida2: string | null
}

export function horarioTrabalhoVazio(): HorarioTrabalho {
  return {
    horarioTrabalhoEntrada1: null,
    horarioTrabalhoSaida1: null,
    horarioTrabalhoEntrada2: null,
    horarioTrabalhoSaida2: null,
  }
}

export function horarioTrabalhoPadrao(): HorarioTrabalho {
  return {
    horarioTrabalhoEntrada1: HORARIO_TRABALHO_PADRAO.entrada1,
    horarioTrabalhoSaida1: HORARIO_TRABALHO_PADRAO.saida1,
    horarioTrabalhoEntrada2: HORARIO_TRABALHO_PADRAO.entrada2,
    horarioTrabalhoSaida2: HORARIO_TRABALHO_PADRAO.saida2,
  }
}

export function validateHorarioTrabalho(h: HorarioTrabalho): string | null {
  const { horarioTrabalhoEntrada1: e1, horarioTrabalhoSaida1: s1, horarioTrabalhoEntrada2: e2, horarioTrabalhoSaida2: s2 } = h

  if (!e1 || !s1 || !e2 || !s2) {
    return 'Preencha todos os horários da jornada de trabalho'
  }

  for (const [label, time] of [
    ['entrada', e1],
    ['saída para intervalo', s1],
    ['retorno do intervalo', e2],
    ['saída', s2],
  ] as const) {
    if (!isValidTimeFormat(time)) {
      return `Horário de ${label} inválido (use HH:mm)`
    }
  }

  if (!isValidTimeSequence(e1, s1)) {
    return 'A saída para intervalo deve ser após a entrada'
  }
  if (!isValidNonOverlapping(s1, e2)) {
    return 'O retorno do intervalo deve ser após o início da pausa'
  }
  if (!isValidTimeSequence(e2, s2)) {
    return 'A saída deve ser após o retorno do intervalo'
  }

  return null
}
