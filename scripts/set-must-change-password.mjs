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
if (!userId) {
  console.error('Uso: node scripts/set-must-change-password.mjs <user-id> [true|false]')
  process.exit(1)
}

const value = process.argv[3] !== 'false'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await admin
  .from('profiles')
  .update({ must_change_password: value })
  .eq('id', userId)
  .select('id,email,must_change_password')
  .single()

if (error) {
  console.error(error.message)
  process.exit(1)
}

console.log('Perfil atualizado:', data)
