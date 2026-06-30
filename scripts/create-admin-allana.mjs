/**
 * Cria admin allanasantiago@fieb.com
 * Uso: node scripts/create-admin-allana.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  break
}

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1\/?$/i, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = 'allanasantiago@fieb.com'
const password = '1234567'
const profile = {
  matricula: 'ADM002',
  nome: 'Allana Santiago',
  cargo: 'admin',
  departamento: 'RH',
  carga_horaria_semanal: 2400,
}

const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
let userId = list?.users?.find((u) => u.email === email)?.id

if (!userId) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: profile,
  })
  if (error) throw error
  userId = data.user.id
  console.log('Usuário auth criado')
} else {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    user_metadata: profile,
  })
  if (error) throw error
  console.log('Usuário já existia — senha e metadata atualizados')
}

const { error: profileError } = await supabase.from('profiles').upsert({
  id: userId,
  email,
  ...profile,
  gestor_id: null,
  must_change_password: false,
})
if (profileError) throw profileError

console.log('Admin pronto:')
console.log(`  Email: ${email}`)
console.log(`  Senha: ${password}`)
console.log(`  Cargo: admin`)
