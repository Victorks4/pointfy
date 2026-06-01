import { ZodError } from 'zod'
import type { ActionResult, CompensacaoActionResult } from '@/lib/types/action-result'

export type { ActionResult, CompensacaoActionResult }

export function formatZodError(error: ZodError): string {
  return error.errors.map((e) => e.message).join('; ')
}

export function toActionError(error: unknown): string {
  if (error instanceof ZodError) return formatZodError(error)
  if (error instanceof Error) return error.message
  return 'Erro desconhecido'
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

export function compensacaoToAction(
  result: CompensacaoActionResult,
): ActionResult<CompensacaoActionResult> {
  if (result.ok) return { success: true, data: result }
  const messages: Record<string, string> = {
    nao_encontrada: 'Justificativa não encontrada',
    nao_autorizado: 'Sem permissão para esta ação',
    ja_decidida: 'Esta compensação já foi decidida',
    pendente: 'Operação pendente',
  }
  return {
    success: false,
    error: messages[result.reason] ?? 'Não foi possível processar a compensação',
  }
}
