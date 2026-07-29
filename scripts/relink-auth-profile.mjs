/**
 * Corrige conta com Auth e profile desalinhados (e-mail duplicado / ID diferente).
 * Uso: node scripts/relink-auth-profile.mjs <email>
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file)
    if (!existsSync(path)) continue
    const content = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) {
        const key = m[1].trim()
        const val = m[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = val
      }
    }
    return
  }
  process.exit(1)
}

loadEnv()

const emailArg = process.argv[2]
if (!emailArg) {
  console.error('Uso: node scripts/relink-auth-profile.mjs <email>')
  process.exit(1)
}

const email = emailArg.includes('@') ? emailArg : `${emailArg}@fieb.org.br`
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
const authUser = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!authUser) {
  console.error('Usuário Auth não encontrado:', email)
  process.exit(1)
}

const { data: profiles } = await admin.from('profiles').select('*').ilike('email', email)
const currentProfile = profiles?.find((p) => p.id === authUser.id)
const orphanProfiles = profiles?.filter((p) => p.id !== authUser.id) ?? []

if (currentProfile) {
  console.log('Perfil já vinculado ao Auth correto:', currentProfile.email, currentProfile.cargo)
  process.exit(0)
}

for (const orphan of orphanProfiles) {
  console.log('Removendo perfil órfão:', orphan.id, orphan.email)
  const { error } = await admin.from('profiles').delete().eq('id', orphan.id)
  if (error) {
    console.error('Erro ao remover perfil órfão:', error.message)
    process.exit(1)
  }

  const orphanAuth = list.users.find((u) => u.id === orphan.id)
  if (orphanAuth && orphanAuth.id !== authUser.id) {
    console.log('Removendo Auth órfão:', orphanAuth.id, orphanAuth.email)
    const { error: delAuthError } = await admin.auth.admin.deleteUser(orphanAuth.id)
    if (delAuthError) {
      console.error('Erro ao remover Auth órfão:', delAuthError.message)
      process.exit(1)
    }
  }
}

const meta = authUser.user_metadata ?? {}
const cargo = meta.cargo ?? 'estagiario'
const insert = {
  id: authUser.id,
  email: authUser.email,
  matricula: meta.matricula ?? meta.ra ?? '',
  nome: meta.nome ?? authUser.email.split('@')[0],
  cargo,
  departamento: meta.departamento ?? '',
  carga_horaria_semanal: cargo === 'gestor' || cargo === 'admin' ? 2400 : 1800,
  must_change_password: false,
}

console.log('Criando perfil:', insert)
const { data: created, error: insertError } = await admin
  .from('profiles')
  .insert(insert)
  .select('id,email,nome,cargo,matricula,departamento')
  .single()

if (insertError) {
  console.error('Erro ao criar perfil:', insertError.message)
  process.exit(1)
}

console.log('Conta corrigida:', created)
