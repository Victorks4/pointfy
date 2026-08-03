import { compensacaoAfetaSaldo, compensacaoTipoLabel } from '@/lib/compensacao-utils'
import { ANOTACAO_DATA_POSTERIOR } from '@/lib/labels'
import { formatMinutesToDisplay } from '@/lib/time-utils'
import type { Justificativa, PontoRegistro } from '@/lib/types'
import type { PontoDetalhe } from '@/lib/pdf/relatorios'

export function stripAnotacaoDataPosterior(observacao: string | null | undefined): string | null {
  if (!observacao?.trim()) return null
  const cleaned = observacao
    .replace(new RegExp(`${ANOTACAO_DATA_POSTERIOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.?\\s*`, 'g'), '')
    .trim()
  return cleaned || null
}

export function getMonthDateKeys(year: string, month: string): string[] {
  const y = Number(year)
  const m = Number(month)
  const daysInMonth = new Date(y, m, 0).getDate()
  const monthKey = String(m).padStart(2, '0')
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return `${year}-${monthKey}-${day}`
  })
}

function getCompensacaoObservacoes(day: string, justificativas: Justificativa[]): string[] {
  const notes: string[] = []

  for (const justificativa of justificativas) {
    if (!compensacaoAfetaSaldo(justificativa)) continue

    if (justificativa.tipo === 'compensacao' && justificativa.data === day) {
      notes.push(compensacaoTipoLabel(justificativa.tipo))
      continue
    }

    if (justificativa.tipo === 'compensacao_parcial' && justificativa.dataCompensacao === day) {
      const minutos =
        justificativa.minutosSolicitados ??
        (justificativa.minutosAbatidos !== 0 ? Math.abs(justificativa.minutosAbatidos) : null)
      const minutosLabel = minutos ? ` (${formatMinutesToDisplay(minutos)})` : ''
      notes.push(`${compensacaoTipoLabel(justificativa.tipo)}${minutosLabel}`)
    }
  }

  return notes
}

function mergeObservacao(observacao: string | null | undefined, compensacaoNotes: string[]): string | null {
  const parts = [stripAnotacaoDataPosterior(observacao), ...compensacaoNotes].filter(Boolean) as string[]
  return parts.length > 0 ? parts.join('. ') : null
}

export function buildRelatorioPresencaRows(params: {
  year: string
  month: string
  userId: string
  pontos: PontoRegistro[]
  justificativas: Justificativa[]
}): PontoDetalhe[] {
  const { year, month, userId, pontos, justificativas } = params
  const pontosMap = new Map(
    pontos.filter((ponto) => ponto.userId === userId).map((ponto) => [ponto.data, ponto]),
  )
  const userJustificativas = justificativas.filter((justificativa) => justificativa.userId === userId)

  return getMonthDateKeys(year, month).map((data) => {
    const ponto = pontosMap.get(data)
    const compensacaoNotes = getCompensacaoObservacoes(data, userJustificativas)

    if (ponto) {
      return {
        data: ponto.data,
        entrada1: ponto.entrada1,
        saida1: ponto.saida1,
        entrada2: ponto.entrada2,
        saida2: ponto.saida2,
        totalMinutos: ponto.totalMinutos,
        observacao: mergeObservacao(ponto.observacao, compensacaoNotes),
      }
    }

    return {
      data,
      entrada1: null,
      saida1: null,
      entrada2: null,
      saida2: null,
      totalMinutos: 0,
      observacao: compensacaoNotes.length > 0 ? compensacaoNotes.join('. ') : null,
    }
  })
}
