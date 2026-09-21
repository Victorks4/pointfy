import { toast } from 'sonner'
import type { ActionResult } from '@/lib/types/action-result'

export async function runDataAction(
  action: Promise<ActionResult<unknown>>,
  onSuccess: () => void | Promise<void>,
  errorMessage = 'Não foi possível concluir a operação.',
): Promise<ActionResult<unknown>> {
  const result = await action
  if (result.success) {
    await onSuccess()
  } else {
    toast.error(result.error ?? errorMessage)
  }
  return result
}

export async function runVoidAction(
  action: Promise<ActionResult<unknown>>,
  onSuccess: () => void | Promise<void>,
  errorMessage = 'Não foi possível concluir a operação.',
): Promise<void> {
  await runDataAction(action, onSuccess, errorMessage)
}
