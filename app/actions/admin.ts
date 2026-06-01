'use server'

import * as usuarioService from '@/lib/server/services/usuario.service'
import * as notificacaoService from '@/lib/server/services/notificacao.service'
import * as adminService from '@/lib/server/services/admin.service'
import { runAction } from '@/lib/server/action-result'
import { parseInput } from '@/lib/validations/parse'
import { desafioProgressoSchema, notificacaoReadSchema } from '@/lib/validations/schemas'
import { uuidSchema } from '@/lib/validations/parse'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { User, Notificacao, BloqueioPresenca, DesafioSemanal, DesafioProgresso, PontoConfig } from '@/lib/types'

export async function createUsuarioAction(input: unknown) {
  return runAction<User>(async () => {
    const r = await usuarioService.createUsuario(input)
    revalidatePath('/dashboard')
    return r
  })
}

export async function updateUsuarioAction(id: string, input: unknown) {
  return runAction<User>(async () => {
    parseInput(uuidSchema, id)
    const r = await usuarioService.updateUsuario(id, input)
    revalidatePath('/dashboard')
    return r
  })
}

export async function deleteUsuarioAction(id: string) {
  return runAction<void>(async () => {
    parseInput(uuidSchema, id)
    await usuarioService.deleteUsuario(id)
    revalidatePath('/dashboard')
  })
}

export async function createNotificacaoAction(input: unknown) {
  return runAction<Notificacao>(async () => {
    const r = await notificacaoService.createNotificacao(input)
    revalidatePath('/dashboard')
    return r
  })
}

export async function markNotificacaoReadAction(notificacaoId: string, userId: string) {
  return runAction<void>(async () => {
    parseInput(notificacaoReadSchema, { notificacaoId, userId })
    await notificacaoService.markNotificacaoAsRead(notificacaoId, userId)
    revalidatePath('/dashboard')
  })
}

export async function addBloqueioAction(input: unknown) {
  return runAction<BloqueioPresenca>(async () => {
    const r = await adminService.addBloqueio(input)
    revalidatePath('/dashboard')
    return r
  })
}

export async function removeBloqueioAction(id: string) {
  return runAction<void>(async () => {
    parseInput(uuidSchema, id)
    await adminService.removeBloqueio(id)
    revalidatePath('/dashboard')
  })
}

export async function addDesafioAction(input: unknown) {
  return runAction<DesafioSemanal>(async () => {
    const r = await adminService.addDesafio(input)
    revalidateTag('desafios-semanais', 'max')
    revalidatePath('/dashboard')
    return r
  })
}

export async function updateDesafioAction(id: string, input: unknown) {
  return runAction<DesafioSemanal>(async () => {
    parseInput(uuidSchema, id)
    const r = await adminService.updateDesafio(id, input)
    revalidateTag('desafios-semanais', 'max')
    revalidatePath('/dashboard')
    return r
  })
}

export async function deleteDesafioAction(id: string) {
  return runAction<void>(async () => {
    parseInput(uuidSchema, id)
    await adminService.deleteDesafio(id)
    revalidateTag('desafios-semanais', 'max')
    revalidatePath('/dashboard')
  })
}

export async function upsertDesafioProgressoAction(
  userId: string,
  desafioId: string,
  progressoAtual: number,
  concluido: boolean,
) {
  return runAction<DesafioProgresso>(async () => {
    parseInput(desafioProgressoSchema, { userId, desafioId, progressoAtual, concluido })
    const r = await adminService.upsertDesafioProgresso(userId, desafioId, progressoAtual, concluido)
    revalidatePath('/dashboard')
    return r
  })
}

export async function addPontoConfigAction(input: unknown) {
  return runAction<PontoConfig>(async () => {
    const r = await adminService.addPontoConfig(input)
    revalidateTag('ponto-configs', 'max')
    revalidatePath('/dashboard')
    return r
  })
}

export async function updatePontoConfigAction(id: string, input: unknown) {
  return runAction<PontoConfig>(async () => {
    parseInput(uuidSchema, id)
    const r = await adminService.updatePontoConfig(id, input)
    revalidateTag('ponto-configs', 'max')
    revalidatePath('/dashboard')
    return r
  })
}

export async function deletePontoConfigAction(id: string) {
  return runAction<void>(async () => {
    parseInput(uuidSchema, id)
    await adminService.deletePontoConfig(id)
    revalidateTag('ponto-configs', 'max')
    revalidatePath('/dashboard')
  })
}
