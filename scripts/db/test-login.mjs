import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function loadEnv(rel) {
  const path = resolve(root, rel)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

loadEnv('.env.local')
loadEnv('.env')
loadEnv('e2e/credentials.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou anon key')
  process.exit(1)
}

const pub = createClient(url, anon)
const admin = service
  ? createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

const pairs = [
  ['E2E_EMAIL', 'E2E_PASSWORD', 'estagiario'],
  ['E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD', 'admin'],
  ['E2E_GESTOR_EMAIL', 'E2E_GESTOR_PASSWORD', 'gestor'],
].filter(([e, p]) => process.env[e] && process.env[p])

const ref = url.match(/https:\/\/([^.]+)/)?.[1] ?? url
console.log(`Projeto: ${ref}`)
console.log('--- signInWithPassword ---')

let ok = 0
let fail = 0
for (const [ek, pk, label] of pairs) {
  const email = process.env[ek]
  const { data, error } = await pub.auth.signInWithPassword({
    email,
    password: process.env[pk],
  })
  await pub.auth.signOut()
  if (error) {
    fail++
    console.log(`FAIL [${label}] ${email}: ${error.message}`)
  } else {
    ok++
    console.log(`OK   [${label}] ${email} (id ${data.user?.id})`)
  }
}

if (pairs.length === 0) {
  console.log('Nenhuma credencial em e2e/credentials.env (E2E_EMAIL/E2E_PASSWORD etc.)')
}

if (admin) {
  const { count: profileCount } = await admin.from('profiles').select('*', { count: 'exact', head: true })
  const { data: allProfiles } = await admin.from('profiles').select('id')
  const { data: authList, error: ae } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (ae) console.log('\nAuth admin:', ae.message)
  else {
    const profileIds = new Set((allProfiles ?? []).map((p) => p.id))
    const orphans = authList.users.filter((u) => !profileIds.has(u.id))
    console.log(`\n--- integridade ---`)
    console.log(`profiles: ${profileCount} | auth.users: ${authList.users.length} | sem profile: ${orphans.length}`)
    if (orphans.length > 0) {
      console.log('Auth sem profile (login pode falhar após auth):')
      orphans.forEach((u) => console.log(`  - ${u.email}`))
    }
  }
}

process.exit(fail > 0 ? 1 : 0)
