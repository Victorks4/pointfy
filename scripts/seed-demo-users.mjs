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
  let loaded = false
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
    console.log(`Variáveis carregadas de ${file}`)
    loaded = true
    break
  }
  if (!loaded) {
    console.error('Crie .env ou .env.local com as variáveis do Supabase')
    process.exit(1)
  }
}

loadEnv()

let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
url = url.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Variáveis Supabase ausentes em .env')
  process.exit(1)
}
if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('/rest/v1')) {
  console.warn('⚠ URL corrigida: remova /rest/v1 do .env (use só https://xxx.supabase.co)')
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
    if (error) {
      if (String(error.message).includes('Database error')) {
        console.error(
          `\nErro ao criar ${email}: falha no banco (trigger profiles?).`,
        )
        console.error('Execute no SQL Editor: supabase/migrations/003_fix_auth_user_trigger.sql\n')
      }
      throw error
    }
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
  const msg = String(e?.message ?? '')
  const cause = e?.cause?.code || e?.cause?.message || ''
  if (msg.includes('Invalid path') || e?.status === 404) {
    console.error('\n❌ URL do Supabase incorreta (Auth 404).')
    console.error('   Use APENAS: https://SEU-PROJETO.supabase.co')
    console.error('   NÃO use: .../rest/v1/  (isso é da Data API, não do app)\n')
  } else if (cause === 'ENOTFOUND' || msg.includes('fetch failed')) {
    console.error('\n❌ Não foi possível conectar ao Supabase.')
    console.error(`   URL no .env: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.error('   O DNS não encontrou esse domínio → a URL do projeto está ERRADA ou o projeto foi removido.')
    console.error('\n   Corrija assim:')
    console.error('   1. Abra https://supabase.com/dashboard → seu projeto')
    console.error('   2. Settings → General → copie "Project URL" (ex: https://abcdefgh.supabase.co)')
    console.error('   3. Cole em NEXT_PUBLIC_SUPABASE_URL no .env e salve')
    console.error('   4. Em API Keys, copie de novo anon e service_role')
    console.error('   5. Rode: npm run db:seed\n')
  } else {
    console.error(e)
  }
  process.exit(1)
})
