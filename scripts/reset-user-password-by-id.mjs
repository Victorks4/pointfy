import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  break
}

const userId = process.argv[2]
const password = process.argv[3]
if (!userId || !password) {
  console.error('Uso: node scripts/reset-user-password-by-id.mjs <user-id> <nova-senha>')
  process.exit(1)
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await admin.auth.admin.updateUserById(userId, {
  password,
  email_confirm: true,
})
if (error) {
  console.error('Erro:', error.message)
  process.exit(1)
}

await admin.from('profiles').update({ must_change_password: true }).eq('id', userId)

const { data: profile } = await admin
  .from('profiles')
  .select('id,email,nome,cargo')
  .eq('id', userId)
  .maybeSingle()

console.log('Senha atualizada:', data.user.email)
console.log('Perfil:', profile ?? 'SEM PERFIL')

const pub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)
const { error: loginError } = await pub.auth.signInWithPassword({
  email: data.user.email,
  password,
})
console.log(loginError ? `Login teste: FALHOU - ${loginError.message}` : 'Login teste: OK')
