/**
 * Cria usuários demo no Supabase Auth + profiles.
 * Uso: node scripts/seed-demo-users.mjs
 * Requer .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) {
    console.error('Crie .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Variáveis Supabase ausentes em .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_USERS = [
  {
    email: 'admin@empresa.com',
    password: 'admin123',
    profile: {
      ra: 'ADM001',
      nome: 'Administrador',
      cargo: 'admin',
      departamento: 'RH',
      carga_horaria_semanal: 2400,
    },
  },
  {
    email: 'gestor@empresa.com',
    password: 'gestor123',
    profile: {
      ra: 'GES001',
      nome: 'Maria Gestora',
      cargo: 'gestor',
      departamento: 'TI',
      carga_horaria_semanal: 2400,
    },
  },
  {
    email: 'estagiario@empresa.com',
    password: 'est123',
    profile: {
      ra: 'EST001',
      nome: 'João Silva',
      cargo: 'estagiario',
      departamento: 'TI',
      carga_horaria_semanal: 1800,
    },
  },
]

async function ensureUser({ email, password, profile }) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users?.find((u) => u.email === email)

  let userId = existing?.id
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: profile,
    })
    if (error) throw error
    userId = data.user.id
    console.log(`Criado auth: ${email}`)
  } else {
    console.log(`Auth já existe: ${email}`)
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    ...profile,
    gestor_id: null,
  })
  if (profileError) throw profileError
  return userId
}

async function main() {
  const gestorId = await ensureUser(DEMO_USERS[1])
  const estId = await ensureUser(DEMO_USERS[2])
  await ensureUser(DEMO_USERS[0])

  const { error } = await supabase
    .from('profiles')
    .update({ gestor_id: gestorId })
    .eq('id', estId)
  if (error) throw error

  console.log('Seed concluído. Login demo:')
  DEMO_USERS.forEach((u) => console.log(`  ${u.email} / ${u.password}`))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
