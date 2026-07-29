/**
 * Diagnostica e cria perfil ausente para usuário no Auth.
 * Uso: node scripts/fix-missing-profile.mjs <email> [--cargo admin|gestor|estagiario]
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
  console.error('Crie .env ou .env.local com as variáveis do Supabase')
  process.exit(1)
}

loadEnv()

const emailArg = process.argv[2]
const cargoArg = process.argv.find((a) => a.startsWith('--cargo='))?.split('=')[1]
  ?? (process.argv.includes('--cargo') ? process.argv[process.argv.indexOf('--cargo') + 1] : null)
  ?? 'admin'

if (!emailArg) {
  console.error('Uso: node scripts/fix-missing-profile.mjs <email> [--cargo admin|gestor|estagiario]')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Variáveis Supabase ausentes em .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = emailArg.includes('@') ? emailArg : `${emailArg}@fieb.org.br`

const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (listError) {
  console.error('Erro ao listar usuários:', listError.message)
  process.exit(1)
}

const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`Usuário não encontrado no Auth: ${email}`)
  process.exit(1)
}

console.log('Auth user:', { id: user.id, email: user.email, metadata: user.user_metadata })

const { data: profile, error: profileError } = await admin
  .from('profiles')
  .select('id,email,nome,cargo,matricula,departamento')
  .eq('id', user.id)
  .maybeSingle()

if (profileError) {
  console.error('Erro ao buscar perfil:', profileError.message)
  process.exit(1)
}

if (profile) {
  console.log('Perfil já existe:', profile)
  process.exit(0)
}

const meta = user.user_metadata ?? {}
const nome = meta.nome ?? 'Allana Santiago'
const matricula = meta.matricula ?? meta.ra ?? 'ADM-ALLANA'
const departamento = meta.departamento ?? 'RH'
const cargo = meta.cargo ?? cargoArg
const cargaHoraria = cargo === 'gestor' ? 2400 : 1800

const insert = {
  id: user.id,
  email: user.email,
  matricula,
  nome,
  cargo,
  departamento,
  carga_horaria_semanal: cargaHoraria,
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

console.log('Perfil criado com sucesso:', created)
