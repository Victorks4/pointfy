import type { Justificativa, StatusCompensacao } from '@/lib/types'
import { MINUTOS_COMPENSACAO } from '@/lib/types'

export function isCompensacaoTipo(tipo: Justificativa['tipo']): boolean {
  return tipo === 'compensacao' || tipo === 'compensacao_parcial'
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
  return 'Atestado'
}
