#!/usr/bin/env node
/**
 * Reset de senha (service role) + obrigar troca no próximo login.
 * Uso: node scripts/db/admin-reset-password.mjs <email> <nova-senha>
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  break
}

const email = process.argv[2]?.trim()
const password = process.argv[3]?.trim()
if (!email || !password) {
  console.error('Uso: node scripts/db/admin-reset-password.mjs <email> <nova-senha>')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: profile, error: pe } = await admin
  .from('profiles')
  .select('id, email, nome, cargo')
  .eq('email', email)
  .maybeSingle()

if (pe || !profile) {
  console.error('Perfil não encontrado:', pe?.message ?? email)
  process.exit(1)
}

const { error: authErr } = await admin.auth.admin.updateUserById(profile.id, { password })
if (authErr) {
  console.error('Auth updateUser:', authErr.message)
  process.exit(1)
}

const { error: flagErr } = await admin
  .from('profiles')
  .update({ must_change_password: true })
  .eq('id', profile.id)

if (flagErr) {
  console.error('profiles.must_change_password:', flagErr.message)
  process.exit(1)
}

console.log(`OK: ${profile.email} (${profile.cargo})`)
console.log('Senha atualizada; must_change_password=true (redireciona para /dashboard/alterar-senha no login).')
