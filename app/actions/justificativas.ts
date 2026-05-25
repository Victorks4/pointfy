'use server'

import * as justificativaService from '@/lib/server/services/justificativa.service'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

export async function createJustificativaAction(input: unknown) {
  const result = await justificativaService.createJustificativa(input)
  revalidatePath('/dashboard')
  return result
}

export async function aprovarCompensacaoAction(justificativaId: string) {
  const result = await justificativaService.aprovarCompensacao(justificativaId)
  revalidatePath('/dashboard')
  return result
}

export async function rejeitarCompensacaoAction(
  justificativaId: string,
  motivoRejeicao?: string,
) {
  const result = await justificativaService.rejeitarCompensacao(justificativaId, motivoRejeicao)
  revalidatePath('/dashboard')
  return result
}

export async function uploadJustificativaArquivoAction(
  formData: FormData,
): Promise<{ path: string } | { error: string }> {
  try {
    const session = await requireAuth()
    const file = formData.get('file') as File | null
    if (!file) return { error: 'Arquivo não enviado' }

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${session.id}/${Date.now()}.${ext}`
    const supabase = await createClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage.from('justificativas').upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })
    if (error) return { error: error.message }
    return { path }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro no upload' }
  }
}
