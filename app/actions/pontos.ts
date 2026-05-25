'use server'

import * as pontoService from '@/lib/server/services/ponto.service'
import { revalidatePath } from 'next/cache'

export async function createPontoAction(input: unknown) {
  const result = await pontoService.createPonto(input)
  revalidatePath('/dashboard')
  return result
}

export async function updatePontoAction(id: string, input: unknown) {
  const result = await pontoService.updatePonto(id, input as Parameters<typeof pontoService.updatePonto>[1])
  revalidatePath('/dashboard')
  return result
}
