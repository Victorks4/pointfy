'use server'

import * as pontoService from '@/lib/server/services/ponto.service'
import { runAction } from '@/lib/server/action-result'
import { revalidatePath } from 'next/cache'
import type { PontoRegistro } from '@/lib/types'

export async function createPontoAction(input: unknown) {
  return runAction<PontoRegistro>(async () => {
    const result = await pontoService.createPonto(input)
    revalidatePath('/dashboard')
    return result
  })
}

export async function updatePontoAction(id: string, input: unknown) {
  return runAction<PontoRegistro>(async () => {
    const result = await pontoService.updatePonto(id, input)
    revalidatePath('/dashboard')
    return result
  })
}
