import type { Justificativa, StatusCompensacao } from '@/lib/types'
import { MINUTOS_COMPENSACAO } from '@/lib/types'

export function isAbonoTipo(tipo: Justificativa['tipo']): boolean {
  return tipo === 'abono'
}

export function isCompensacaoTipo(tipo: Justificativa['tipo']): boolean {
  return tipo === 'compensacao' || tipo === 'compensacao_parcial'
}

export function abonoAfetaSaldo(j: Justificativa): boolean {
  return j.tipo === 'abono'
}

export function minutosAbonoEfetivos(j: Justificativa): number {
  if (!abonoAfetaSaldo(j)) return 0
  return j.minutosAbatidos
}

export function minutosAjusteSaldoEfetivos(j: Justificativa): number {
  if (abonoAfetaSaldo(j)) return minutosAbonoEfetivos(j)
  if (compensacaoAfetaSaldo(j)) return minutosCompensacaoEfetivos(j)
  return 0
}

export function effectiveStatusCompensacao(j: Justificativa): StatusCompensacao | null {
  if (!isCompensacaoTipo(j.tipo)) return null
  return j.statusCompensacao ?? 'aprovada_gestor'
}

export function compensacaoAfetaSaldo(j: Justificativa): boolean {
  if (!isCompensacaoTipo(j.tipo)) return false
  return effectiveStatusCompensacao(j) === 'aprovada_gestor'
}

export const STATUS_COMPENSACAO_LABELS: Record<StatusCompensacao, string> = {
  pendente_gestor: 'Pendente',
  aprovada_gestor: 'Aprovada',
  rejeitada_gestor: 'Rejeitada',
}

export function minutosCompensacaoEfetivos(j: Justificativa): number {
  if (!compensacaoAfetaSaldo(j)) return 0
  if (j.minutosAbatidos !== 0) return j.minutosAbatidos
  if (j.tipo === 'compensacao_parcial' && j.minutosSolicitados) {
    return -j.minutosSolicitados
  }
  return -MINUTOS_COMPENSACAO
}

export function compensacaoTipoLabel(tipo: Justificativa['tipo']): string {
  if (tipo === 'compensacao_parcial') return 'Compensação parcial'
  if (tipo === 'compensacao') return 'Compensação integral'
  if (tipo === 'abono') return 'Abono'
  return 'Atestado'
}

export function formatAbonoMinutosLabel(minutos: number): string {
  const sign = minutos >= 0 ? '+' : ''
  const abs = Math.abs(minutos)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const time = m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  return `${sign}${time}`
}
