import { isPresencaBloqueada } from '@/lib/presenca-bloqueio'
import {
  calculateDayTotal,
  formatMinutesToDisplay,
  getTodayString,
  isUserInRecessPeriod,
  isValidNonOverlapping,
  isValidTimeFormat,
  isValidTimeSequence,
} from '@/lib/time-utils'
import { getLimiteMinutosSemJustificativa } from '@/lib/ponto-config-utils'
import type { BloqueioPresenca, PontoConfig, User } from '@/lib/types'

export type PontoFieldsInput = {
  data: string
  entrada1: string | null
  saida1: string | null
  entrada2: string | null
  saida2: string | null
  totalMinutos: number
  justificativaHoraExtra: string | null
}

export type PontoValidationContext = {
  user: User
  bloqueios: BloqueioPresenca[]
  activeConfig: PontoConfig
}

export function validatePontoBusinessRules(
  fields: PontoFieldsInput,
  ctx: PontoValidationContext,
): string[] {
  const erros: string[] = []
  const { user, bloqueios, activeConfig } = ctx
  const { rejeitarMinutosZero } = activeConfig
  const limiteMinutosSemJustificativa = getLimiteMinutosSemJustificativa(activeConfig)

  if (fields.data > getTodayString()) {
    erros.push('Não é permitido registrar presença em data futura')
  }

  if (isUserInRecessPeriod(fields.data, user)) {
    erros.push('Você está em período de recesso remunerado')
  }

  if (isPresencaBloqueada(bloqueios, user.id, fields.data)) {
    erros.push('Registro de presença bloqueado para esta data')
  }

  const periodos = [
    { label: 'Entrada 1', value: fields.entrada1 },
    { label: 'Saída 1', value: fields.saida1 },
    { label: 'Entrada 2', value: fields.entrada2 },
    { label: 'Saída 2', value: fields.saida2 },
  ]

  for (const { label, value } of periodos) {
    if (!value) continue
    if (!isValidTimeFormat(value)) {
      erros.push(`${label}: formato inválido (use HH:mm)`)
    }
  }

  const { entrada1, saida1, entrada2, saida2 } = fields

  const par1Completo = !!(entrada1 && saida1)
  const par2Completo = !!(entrada2 && saida2)
  const par1Parcial = !!(entrada1 || saida1) && !par1Completo
  const par2Parcial = !!(entrada2 || saida2) && !par2Completo

  if (par1Parcial || par2Parcial) {
    erros.push('Preencha entrada e saída de cada período informado')
  }

  if (!par1Completo && !par2Completo) {
    erros.push('Informe ao menos um período completo (entrada e saída)')
  }

  if (entrada1 && saida1 && !isValidTimeSequence(entrada1, saida1)) {
    erros.push('A Saída 1 deve ser após a Entrada 1')
  }
  if (entrada2 && saida2 && !isValidTimeSequence(entrada2, saida2)) {
    erros.push('A Saída 2 deve ser após a Entrada 2')
  }
  if (saida1 && entrada2 && !isValidNonOverlapping(saida1, entrada2)) {
    erros.push('A Entrada 2 deve ser após a Saída 1')
  }

  const totalCalculado = calculateDayTotal(entrada1, saida1, entrada2, saida2)
  if (fields.totalMinutos !== totalCalculado) {
    erros.push('Total de minutos inconsistente com os horários informados')
  }

  const precisaJustificativa = totalCalculado > limiteMinutosSemJustificativa
  if (precisaJustificativa && !fields.justificativaHoraExtra?.trim()) {
    erros.push(
      `Acima de ${formatMinutesToDisplay(limiteMinutosSemJustificativa)} é necessário uma justificativa`,
    )
  }

  if (activeConfig.rejeitarMinutosZero && totalCalculado === 0) {
    erros.push('Registro com zero minutos não é permitido')
  }

  return erros
}

export function assertPontoBusinessRules(
  fields: PontoFieldsInput,
  ctx: PontoValidationContext,
): void {
  const erros = validatePontoBusinessRules(fields, ctx)
  if (erros.length > 0) {
    throw new Error(erros.join('; '))
  }
}
