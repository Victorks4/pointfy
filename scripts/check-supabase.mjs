import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file)
    if (!existsSync(path)) continue
    console.log(`Carregando ${file}`)
    const content = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
    return
  }
  console.error('Nenhum .env ou .env.local encontrado')
  process.exit(1)
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', url ? 'OK' : 'FALTANDO')
console.log('Service key:', service ? `OK (${service.length} chars)` : 'FALTANDO')
console.log('Anon key:', anon ? `OK (${anon.length} chars)` : 'FALTANDO')

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: profiles, error: pe } = await admin.from('profiles').select('id,email,nome,cargo').limit(10)
if (pe) {
  console.log('\n❌ Tabela profiles:', pe.message)
  if (pe.code === 'PGRST205' || pe.message.includes('does not exist')) {
    console.log('   → Rode as migrations SQL no Supabase (001 e 002)')
  }
} else {
  console.log('\n✓ profiles:', profiles?.length ?? 0, 'registro(s)')
  profiles?.forEach((p) => console.log(`   - ${p.email} (${p.cargo})`))
}

const { data: authList, error: ae } = await admin.auth.admin.listUsers({ perPage: 20 })
if (ae) console.log('\n❌ Auth admin:', ae.message)
else {
  console.log('\n✓ Auth users:', authList.users.length)
  authList.users.forEach((u) => console.log(`   - ${u.email}`))
}

const pub = createClient(url, anon)
for (const cred of [
  { email: 'admin@empresa.com', password: 'admin123' },
  { email: 'estagiario@empresa.com', password: 'est123' },
]) {
  const { error } = await pub.auth.signInWithPassword(cred)
  console.log(error ? `\n❌ Login ${cred.email}: ${error.message}` : `\n✓ Login ${cred.email}: OK`)
}
