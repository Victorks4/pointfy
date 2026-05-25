import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapProfile, profileToInsert } from '@/lib/server/mappers'
import { requireRole } from '@/lib/server/auth'
import { usuarioInputSchema } from '@/lib/validations/schemas'
import type { User } from '@/lib/types'
import type { ProfileRow } from '@/lib/server/db-types'

export async function listUsuarios(): Promise<User[]> {
  await requireRole('admin', 'gestor')
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('nome')
  if (error) throw error
  return (data as ProfileRow[]).map(mapProfile)
}

export async function getEstagiariosDoGestor(gestorId: string): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('cargo', 'estagiario')
    .eq('gestor_id', gestorId)
  if (error) throw error
  return (data as ProfileRow[]).map(mapProfile)
}

export async function createUsuario(input: unknown): Promise<User> {
  await requireRole('admin')
  const parsed = usuarioInputSchema.parse(input)
  if (!parsed.senha) throw new Error('Senha obrigatória para novo usuário')

  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.senha,
    email_confirm: true,
    user_metadata: {
      ra: parsed.ra,
      nome: parsed.nome,
      cargo: parsed.cargo,
      departamento: parsed.departamento,
    },
  })
  if (authError) throw authError

  const profile = profileToInsert({
    email: parsed.email,
    ra: parsed.ra,
    nome: parsed.nome,
    cargo: parsed.cargo,
    departamento: parsed.departamento,
    cargaHorariaSemanal: parsed.cargaHorariaSemanal,
    dataInicioRecesso: parsed.dataInicioRecesso ?? null,
    dataFimRecesso: parsed.dataFimRecesso ?? null,
    gestorId: parsed.gestorId ?? null,
  })

  const { data, error } = await admin
    .from('profiles')
    .upsert({ id: authData.user.id, ...profile })
    .select()
    .single()

  if (error) throw error
  return mapProfile(data as ProfileRow)
}

export async function updateUsuario(id: string, input: unknown): Promise<User> {
  await requireRole('admin')
  const parsed = usuarioInputSchema.partial().parse(input)
  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  if (parsed.ra) update.ra = parsed.ra
  if (parsed.nome) update.nome = parsed.nome
  if (parsed.cargo) update.cargo = parsed.cargo
  if (parsed.departamento) update.departamento = parsed.departamento
  if (parsed.cargaHorariaSemanal) update.carga_horaria_semanal = parsed.cargaHorariaSemanal
  if (parsed.dataInicioRecesso !== undefined) update.data_inicio_recesso = parsed.dataInicioRecesso
  if (parsed.dataFimRecesso !== undefined) update.data_fim_recesso = parsed.dataFimRecesso
  if (parsed.gestorId !== undefined) update.gestor_id = parsed.gestorId

  const { data, error } = await supabase.from('profiles').update(update).eq('id', id).select().single()
  if (error) throw error
  return mapProfile(data as ProfileRow)
}

export async function deleteUsuario(id: string): Promise<void> {
  await requireRole('admin')
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw error
}
