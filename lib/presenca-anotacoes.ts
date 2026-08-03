import { ANOTACAO_DATA_POSTERIOR } from '@/lib/labels'

export { ANOTACAO_DATA_POSTERIOR }

export function buildObservacaoComAnotacao(
  _dataRegistro: string,
  observacaoExistente: string | null,
): string | null {
  return observacaoExistente
}
