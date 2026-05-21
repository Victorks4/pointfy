import type { Justificativa, StatusCompensacao } from '@/lib/types'
import { MINUTOS_COMPENSACAO } from '@/lib/types'

export function effectiveStatusCompensacao(j: Justificativa): StatusCompensacao | null {
  if (j.tipo !== 'compensacao') return null
  return j.statusCompensacao ?? 'aprovada_gestor'
}

export function compensacaoAfetaSaldo(j: Justificativa): boolean {
  if (j.tipo !== 'compensacao') return false
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
  return -MINUTOS_COMPENSACAO
}
