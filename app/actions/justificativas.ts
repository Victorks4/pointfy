'use server'

import * as justificativaService from '@/lib/server/services/justificativa.service'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/server/auth'
import { runAction, compensacaoToAction, type ActionResult } from '@/lib/server/action-result'
import { validateUploadFile } from '@/lib/validations/schemas'
import { compensacaoDecisionSchema } from '@/lib/validations/schemas'
import { parseInput } from '@/lib/validations/parse'
import { revalidatePath } from 'next/cache'
import type { Justificativa } from '@/lib/types'
import type { CompensacaoActionResult } from '@/lib/server/action-result'

export async function createJustificativaAction(input: unknown) {
  return runAction<Justificativa>(async () => {
    const result = await justificativaService.createJustificativa(input)
    revalidatePath('/dashboard')
    return result
  })
}

export async function aprovarCompensacaoAction(justificativaId: string) {
  return runAction<CompensacaoActionResult>(async () => {
    parseInput(compensacaoDecisionSchema, { justificativaId })
    const result = await justificativaService.aprovarCompensacao(justificativaId)
    revalidatePath('/dashboard')
    const mapped = compensacaoToAction(result)
    if (!mapped.success) throw new Error(mapped.error)
    return result
  })
}

export async function rejeitarCompensacaoAction(
  justificativaId: string,
  motivoRejeicao?: string,
) {
  return runAction<CompensacaoActionResult>(async () => {
    parseInput(compensacaoDecisionSchema, { justificativaId, motivoRejeicao })
    const result = await justificativaService.rejeitarCompensacao(justificativaId, motivoRejeicao)
    revalidatePath('/dashboard')
    const mapped = compensacaoToAction(result)
    if (!mapped.success) throw new Error(mapped.error)
    return result
  })
}

export async function uploadJustificativaArquivoAction(
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  return runAction(async () => {
    const session = await requireAuth()
    const file = formData.get('file') as File | null
    if (!file) throw new Error('Arquivo não enviado')

    const uploadError = validateUploadFile(file)
    if (uploadError) throw new Error(uploadError)

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${session.id}/${Date.now()}.${ext}`
    const supabase = await createClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage.from('justificativas').upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw new Error(error.message)
    return { path }
  })
}
