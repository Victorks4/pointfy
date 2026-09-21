import { ANOTACAO_DATA_POSTERIOR } from '@/lib/constants/labels'

export { ANOTACAO_DATA_POSTERIOR }

export function buildObservacaoComAnotacao(
  _dataRegistro: string,
  observacaoExistente: string | null,
): string | null {
  return observacaoExistente
}
