import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapProfile, profileToInsert } from '@/lib/server/mappers'
import { requireRole } from '@/lib/server/auth'
import { parseInput } from '@/lib/validations/parse'
import { usuarioInputSchema, usuarioUpdateSchema } from '@/lib/validations/schemas'
import { PROFILE_COLUMNS } from '@/lib/server/query-columns'
import { notifyRecessoCadastrado } from '@/lib/server/services/hr-scheduler.service'
import { buildPasswordResetRedirectUrl, getSiteOrigin } from '@/lib/auth/site-origin'
import type { User } from '@/lib/types'
import type { EstagiarioGestorRow, ProfileRow } from '@/lib/server/db-types'
import { randomBytes } from 'node:crypto'

export type PasswordResetForUsuarioResult =
  | { mode: 'email' }
  | { mode: 'temporary'; senhaTemporaria: string }

function generateTemporaryPassword(): string {
  const raw = randomBytes(9).toString('base64url')
  return `Pf${raw}!`
}

async function loadGestorIdsMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  estagiarioIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (estagiarioIds.length === 0) return map

  const { data, error } = await supabase
    .from('estagiario_gestores')
    .select('estagiario_id, gestor_id')
    .in('estagiario_id', estagiarioIds)

  if (error) throw error
  for (const row of (data as EstagiarioGestorRow[]) ?? []) {
    const list = map.get(row.estagiario_id) ?? []
    list.push(row.gestor_id)
    map.set(row.estagiario_id, list)
  }
  return map
}

async function syncGestorLinks(
  admin: ReturnType<typeof createAdminClient>,
  estagiarioId: string,
  gestorPrincipal: string | null,
  gestorIds?: string[],
) {
  const allGestors = new Set<string>()
  if (gestorPrincipal) allGestors.add(gestorPrincipal)
  for (const id of gestorIds ?? []) allGestors.add(id)

  await admin.from('estagiario_gestores').delete().eq('estagiario_id', estagiarioId)

  if (allGestors.size === 0) return

  const rows = [...allGestors].map((gestor_id) => ({
    estagiario_id: estagiarioId,
    gestor_id,
  }))
  const { error } = await admin.from('estagiario_gestores').insert(rows)
  if (error) throw error
}

export async function listUsuarios(): Promise<User[]> {
  await requireRole('admin', 'gestor')
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).order('nome')
  if (error) throw error
  const rows = data as ProfileRow[]
  const estIds = rows.filter((r) => r.cargo === 'estagiario').map((r) => r.id)
  const gestorMap = await loadGestorIdsMap(supabase, estIds)
  return rows.map((r) => mapProfile(r, gestorMap.get(r.id)))
}

export async function getEstagiariosDoGestor(gestorId: string): Promise<User[]> {
  const supabase = await createClient()
  const { data: links, error: linkErr } = await supabase
    .from('estagiario_gestores')
    .select('estagiario_id')
    .eq('gestor_id', gestorId)
  if (linkErr) throw linkErr

  const linkedIds = (links ?? []).map((l: { estagiario_id: string }) => l.estagiario_id)

  let query = supabase.from('profiles').select(PROFILE_COLUMNS).eq('cargo', 'estagiario')
  if (linkedIds.length > 0) {
    query = query.or(`gestor_id.eq.${gestorId},id.in.(${linkedIds.join(',')})`)
  } else {
    query = query.eq('gestor_id', gestorId)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = data as ProfileRow[]
  const gestorMap = await loadGestorIdsMap(supabase, rows.map((r) => r.id))
  return rows.map((r) => mapProfile(r, gestorMap.get(r.id)))
}

export async function createUsuario(input: unknown): Promise<User> {
  await requireRole('admin')
  const parsed = parseInput(usuarioInputSchema, input)
  if (!parsed.senha) throw new Error('Senha obrigatória para novo usuário')

  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.senha,
    email_confirm: true,
    user_metadata: {
      matricula: parsed.matricula,
      nome: parsed.nome,
      cargo: parsed.cargo,
      departamento: parsed.departamento,
    },
  })
  if (authError) throw authError

  const cargaHorariaSemanal =
    parsed.cargaHorariaSemanal ?? (parsed.cargo === 'gestor' ? 1800 : undefined)
  if (cargaHorariaSemanal == null) {
    throw new Error('Carga horária é obrigatória para estagiário')
  }

  const profile = profileToInsert({
    email: parsed.email,
    matricula: parsed.matricula,
    nome: parsed.nome,
    cargo: parsed.cargo,
    departamento: parsed.departamento,
    cargaHorariaSemanal,
    dataInicioContrato: parsed.dataInicioContrato ?? null,
    dataFimContrato: parsed.dataFimContrato ?? null,
    dataInicioRecesso1: parsed.dataInicioRecesso1 ?? null,
    dataFimRecesso1: parsed.dataFimRecesso1 ?? null,
    dataInicioRecesso2: parsed.dataInicioRecesso2 ?? null,
    dataFimRecesso2: parsed.dataFimRecesso2 ?? null,
    mustChangePassword: parsed.mustChangePassword ?? true,
    gestorId: parsed.gestorId ?? null,
    horarioTrabalhoEntrada1: parsed.horarioTrabalhoEntrada1 ?? null,
    horarioTrabalhoSaida1: parsed.horarioTrabalhoSaida1 ?? null,
    horarioTrabalhoEntrada2: parsed.horarioTrabalhoEntrada2 ?? null,
    horarioTrabalhoSaida2: parsed.horarioTrabalhoSaida2 ?? null,
  })

  const { data, error } = await admin
    .from('profiles')
    .upsert({ id: authData.user.id, ...profile })
    .select(PROFILE_COLUMNS)
    .single()

  if (error) throw error

  if (parsed.cargo === 'estagiario') {
    await syncGestorLinks(admin, authData.user.id, parsed.gestorId ?? null, parsed.gestorIds)
  }

  const gestorIds = parsed.gestorIds ?? []
  return mapProfile(data as ProfileRow, gestorIds)
}

export async function updateUsuario(id: string, input: unknown): Promise<User> {
  await requireRole('admin')
  const parsed = parseInput(usuarioUpdateSchema, input)
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: beforeRow, error: beforeErr } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .single()
  if (beforeErr) throw beforeErr
  const before = beforeRow as ProfileRow

  if (before.cargo === 'estagiario') {
    const finalGestorId =
      parsed.gestorId !== undefined ? parsed.gestorId : before.gestor_id
    if (!finalGestorId) {
      throw new Error('Gestor principal é obrigatório para estagiário')
    }
  }

  const update: Record<string, unknown> = {}
  if (parsed.matricula) update.matricula = parsed.matricula
  if (parsed.nome) update.nome = parsed.nome
  if (parsed.cargo) update.cargo = parsed.cargo
  if (parsed.departamento) update.departamento = parsed.departamento
  if (parsed.cargaHorariaSemanal !== undefined) {
    update.carga_horaria_semanal = parsed.cargaHorariaSemanal
  }
  if (parsed.dataInicioContrato !== undefined) update.data_inicio_contrato = parsed.dataInicioContrato
  if (parsed.dataFimContrato !== undefined) update.data_fim_contrato = parsed.dataFimContrato
  if (parsed.dataInicioRecesso1 !== undefined) update.data_inicio_recesso_1 = parsed.dataInicioRecesso1
  if (parsed.dataFimRecesso1 !== undefined) update.data_fim_recesso_1 = parsed.dataFimRecesso1
  if (parsed.dataInicioRecesso2 !== undefined) update.data_inicio_recesso_2 = parsed.dataInicioRecesso2
  if (parsed.dataFimRecesso2 !== undefined) update.data_fim_recesso_2 = parsed.dataFimRecesso2
  if (parsed.mustChangePassword !== undefined) update.must_change_password = parsed.mustChangePassword
  if (parsed.gestorId !== undefined) update.gestor_id = parsed.gestorId
  if (parsed.horarioTrabalhoEntrada1 !== undefined) {
    update.horario_trabalho_entrada_1 = parsed.horarioTrabalhoEntrada1
  }
  if (parsed.horarioTrabalhoSaida1 !== undefined) {
    update.horario_trabalho_saida_1 = parsed.horarioTrabalhoSaida1
  }
  if (parsed.horarioTrabalhoEntrada2 !== undefined) {
    update.horario_trabalho_entrada_2 = parsed.horarioTrabalhoEntrada2
  }
  if (parsed.horarioTrabalhoSaida2 !== undefined) {
    update.horario_trabalho_saida_2 = parsed.horarioTrabalhoSaida2
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) throw error

  if (parsed.gestorId !== undefined || parsed.gestorIds !== undefined) {
    const row = data as ProfileRow
    await syncGestorLinks(admin, id, parsed.gestorId ?? row.gestor_id, parsed.gestorIds)
  }

  const after = data as ProfileRow
  const recessPeriods = [
    {
      numero: 1 as const,
      beforeInicio: before.data_inicio_recesso_1,
      beforeFim: before.data_fim_recesso_1,
      afterInicio: after.data_inicio_recesso_1,
      afterFim: after.data_fim_recesso_1,
    },
    {
      numero: 2 as const,
      beforeInicio: before.data_inicio_recesso_2,
      beforeFim: before.data_fim_recesso_2,
      afterInicio: after.data_inicio_recesso_2,
      afterFim: after.data_fim_recesso_2,
    },
  ]

  for (const period of recessPeriods) {
    const changed =
      period.beforeInicio !== period.afterInicio || period.beforeFim !== period.afterFim
    if (changed && period.afterInicio && period.afterFim) {
      await notifyRecessoCadastrado(id, period.afterInicio, period.afterFim, period.numero)
    }
  }

  const gestorMap = await loadGestorIdsMap(supabase, [id])
  return mapProfile(data as ProfileRow, gestorMap.get(id))
}

export async function clearMustChangePassword(userId: string): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userId)
    .select('id')
    .single()
  if (error) throw error
  if (!data) throw new Error('Não foi possível atualizar o perfil')
}

export async function deleteUsuario(id: string): Promise<void> {
  await requireRole('admin')
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw error
}

export async function requestPasswordResetForUsuario(
  userId: string,
): Promise<PasswordResetForUsuarioResult> {
  const adminUser = await requireRole('admin')
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single()

  if (profileError || !profile?.email) {
    throw new Error('Usuário não encontrado')
  }

  const origin = await getSiteOrigin()
  const redirectTo = buildPasswordResetRedirectUrl(origin)

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, {
    redirectTo,
  })

  if (!resetError) {
    console.info('[admin] password_reset', {
      adminId: adminUser.id,
      targetUserId: userId,
      mode: 'email',
    })
    return { mode: 'email' }
  }

  console.warn('[admin] password_reset email failed, using temporary password', {
    adminId: adminUser.id,
    targetUserId: userId,
    error: resetError.message,
  })

  const senhaTemporaria = generateTemporaryPassword()
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: senhaTemporaria,
  })
  if (updateError) throw updateError

  const { error: flagError } = await admin
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', userId)
  if (flagError) throw flagError

  console.info('[admin] password_reset', {
    adminId: adminUser.id,
    targetUserId: userId,
    mode: 'temporary',
  })

  return { mode: 'temporary', senhaTemporaria }
}
