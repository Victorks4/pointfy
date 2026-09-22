/**
 * MigraÃ§Ã£o via Supabase REST (service_role) â€” evita pg_dump/Docker/IPv6.
 * migrate.env: LEGACY_SUPABASE_URL, LEGACY_SERVICE_ROLE_KEY
 * .env: destino Senai (URL + SUPABASE_SERVICE_ROLE_KEY)
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

function loadEnvFile(path) {
  const env = {}
  if (!existsSync(path)) return env
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const migrate = loadEnvFile(resolve(here, 'migrate.env'))
const local = { ...loadEnvFile(resolve(root, '.env.local')), ...loadEnvFile(resolve(root, '.env')) }

const legacyUrl = migrate.LEGACY_SUPABASE_URL || 'https://royszemnvodpzhwswpmm.supabase.co'
const legacyKey = migrate.LEGACY_SERVICE_ROLE_KEY
const targetUrl = local.NEXT_PUBLIC_SUPABASE_URL
const targetKey = local.SUPABASE_SERVICE_ROLE_KEY

if (!legacyKey) throw new Error('LEGACY_SERVICE_ROLE_KEY em scripts/db/migrate.env')
if (!targetUrl || !targetKey) throw new Error('Destino: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')

const legacy = createClient(legacyUrl, legacyKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const target = createClient(targetUrl, targetKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PAGE = 1000

async function fetchAll(client, table, select = '*') {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await client.from(table).select(select).range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return rows
}

function upsertOptions(table) {
  if (table === 'estagiario_gestores') {
    return { onConflict: 'estagiario_id,gestor_id' }
  }
  if (table === 'notificacao_leituras') {
    return { onConflict: 'notificacao_id,user_id' }
  }
  return { onConflict: 'id' }
}

async function insertBatches(client, table, rows) {
  if (!rows.length) return 0
  const options = upsertOptions(table)
  let n = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error } = await client.from(table).upsert(batch, options)
    if (error) throw new Error(`${table} insert: ${error.message}`)
    n += batch.length
  }
  return n
}

/** auth.users via Admin API */
async function migrateAuthUsers() {
  const { data, error } = await legacy.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const users = data.users ?? []
  console.log(`auth.users (origem): ${users.length}`)
  for (const u of users) {
    const { error: createErr } = await target.auth.admin.createUser({
      id: u.id,
      email: u.email ?? '',
      email_confirm: true,
      phone: u.phone,
      phone_confirm: u.phone_confirmed_at != null,
      user_metadata: u.user_metadata ?? {},
      app_metadata: u.app_metadata ?? {},
    })
    if (createErr && !/already|registered|exists/i.test(createErr.message)) {
      console.warn(`  auth ${u.email}: ${createErr.message}`)
    }
  }
  return users.length
}

const TABLES = [
    'profiles',
    'estagiario_gestores',
    'feriados',
    'ponto_configs',
    'desafios_semanais',
    'ponto_registros',
    'justificativas',
    'bloqueios_presenca',
    'notificacoes',
    'notificacao_leituras',
    'desafio_progressos',
]

async function main() {
  const skipAuth = process.env.SKIP_AUTH === '1'
  const onlyTables = process.env.ONLY_TABLES?.split(',').map((t) => t.trim()).filter(Boolean)

  if (!skipAuth) {
    console.log('Migrando auth (admin API)...')
    await migrateAuthUsers()
  }

  const tables = onlyTables?.length ? onlyTables : TABLES

  for (const table of tables) {
    console.log(`Copiando ${table}...`)
    const rows = await fetchAll(legacy, table)
    const n = await insertBatches(target, table, rows)
    console.log(`  ${n} linhas`)
  }

  const { count: profiles } = await target.from('profiles').select('*', { count: 'exact', head: true })
  const { count: pontos } = await target.from('ponto_registros').select('*', { count: 'exact', head: true })
  console.log('\nDestino:', { profiles, pontos })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

