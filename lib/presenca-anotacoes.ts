import { ANOTACAO_DATA_POSTERIOR } from '@/lib/labels'

export { ANOTACAO_DATA_POSTERIOR }

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Registro feito em calendário posterior ao dia da presença (ex.: hoje registra dia anterior). */
export function isRegistroEmDataPosterior(
  dataRegistro: string,
  registeredAt: Date = new Date(),
): boolean {
  return toDateKey(registeredAt) > dataRegistro
}

export function buildObservacaoComAnotacao(
  dataRegistro: string,
  observacaoExistente: string | null,
  registeredAt: Date = new Date(),
): string | null {
  if (!isRegistroEmDataPosterior(dataRegistro, registeredAt)) {
    return observacaoExistente
  }
  if (observacaoExistente?.includes(ANOTACAO_DATA_POSTERIOR)) {
    return observacaoExistente
  }
  if (observacaoExistente?.trim()) {
    return `${ANOTACAO_DATA_POSTERIOR}. ${observacaoExistente}`
  }
  return ANOTACAO_DATA_POSTERIOR
}
