'use server'

import * as usuarioService from '@/lib/server/services/usuario.service'
import * as notificacaoService from '@/lib/server/services/notificacao.service'
import * as adminService from '@/lib/server/services/admin.service'
import { revalidatePath } from 'next/cache'

export async function createUsuarioAction(input: unknown) {
  const r = await usuarioService.createUsuario(input)
  revalidatePath('/dashboard')
  return r
}

export async function updateUsuarioAction(id: string, input: unknown) {
  const r = await usuarioService.updateUsuario(id, input)
  revalidatePath('/dashboard')
  return r
}

export async function deleteUsuarioAction(id: string) {
  await usuarioService.deleteUsuario(id)
  revalidatePath('/dashboard')
}

export async function createNotificacaoAction(input: unknown) {
  const r = await notificacaoService.createNotificacao(input)
  revalidatePath('/dashboard')
  return r
}

export async function markNotificacaoReadAction(notificacaoId: string, userId: string) {
  await notificacaoService.markNotificacaoAsRead(notificacaoId, userId)
  revalidatePath('/dashboard')
}

export async function addBloqueioAction(input: unknown) {
  const r = await adminService.addBloqueio(input)
  revalidatePath('/dashboard')
  return r
}

export async function removeBloqueioAction(id: string) {
  await adminService.removeBloqueio(id)
  revalidatePath('/dashboard')
}

export async function addDesafioAction(input: unknown) {
  const r = await adminService.addDesafio(input)
  revalidatePath('/dashboard')
  return r
}

export async function updateDesafioAction(id: string, input: unknown) {
  const r = await adminService.updateDesafio(id, input)
  revalidatePath('/dashboard')
  return r
}

export async function deleteDesafioAction(id: string) {
  await adminService.deleteDesafio(id)
  revalidatePath('/dashboard')
}

export async function upsertDesafioProgressoAction(
  userId: string,
  desafioId: string,
  progressoAtual: number,
  concluido: boolean,
) {
  const r = await adminService.upsertDesafioProgresso(userId, desafioId, progressoAtual, concluido)
  revalidatePath('/dashboard')
  return r
}

export async function addPontoConfigAction(input: unknown) {
  const r = await adminService.addPontoConfig(input)
  revalidatePath('/dashboard')
  return r
}

export async function updatePontoConfigAction(id: string, input: unknown) {
  const r = await adminService.updatePontoConfig(id, input)
  revalidatePath('/dashboard')
  return r
}

export async function deletePontoConfigAction(id: string) {
  await adminService.deletePontoConfig(id)
  revalidatePath('/dashboard')
}
