/**
 * Redefine a senha de um usuário via Supabase Admin API.
 * Uso: node scripts/reset-user-password.mjs <email> <nova-senha>
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
const password = process.argv[3]

if (!emailArg || !password) {
  console.error('Uso: node scripts/reset-user-password.mjs <email> <nova-senha>')
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
  const suggestions = list.users
    .filter((u) => /allana|santiago|fieb/i.test(u.email ?? ''))
    .map((u) => u.email)
  console.error(`Usuário não encontrado: ${email}`)
  if (suggestions.length > 0) {
    console.error('Sugestões:', suggestions.join(', '))
  }
  process.exit(1)
}

const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
})
if (updateError) {
  console.error('Erro ao atualizar senha:', updateError.message)
  process.exit(1)
}

await admin.from('profiles').update({ must_change_password: false }).eq('id', user.id)

console.log(`Senha atualizada para: ${updated.user.email}`)
