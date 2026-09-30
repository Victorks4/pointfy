#!/usr/bin/env node
/**
 * Remove registros operacionais de todos os estagiários (ponto, justificativas, progresso de desafios, etc.).
 * Contas (auth + profiles) permanecem.
 *
 * Prévia:  node scripts/db/reset-estagiarios-operational-data.mjs
 * Executar: node scripts/db/reset-estagiarios-operational-data.mjs --confirm
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

const confirm = process.argv.includes('--confirm')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function countForEstagiarios(table, userIdColumn = 'user_id') {
  const { data: interns, error: ie } = await admin
    .from('profiles')
    .select('id')
    .eq('cargo', 'estagiario')
  if (ie) throw new Error(`profiles: ${ie.message}`)
  const ids = (interns ?? []).map((r) => r.id)
  if (ids.length === 0) return { ids, count: 0 }

  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .in(userIdColumn, ids)
  if (error) throw new Error(`${table}: ${error.message}`)
  return { ids, count: count ?? 0 }
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function deleteIn(table, userIdColumn, ids) {
  let deleted = 0
  for (const part of chunk(ids, 80)) {
    const { error, count } = await admin.from(table).delete({ count: 'exact' }).in(userIdColumn, part)
    if (error) throw new Error(`${table} delete: ${error.message}`)
    deleted += count ?? 0
  }
  return deleted
}

async function purgeJustificativaStorage(paths) {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return 0
  let removed = 0
  for (const part of chunk(unique, 50)) {
    const { error } = await admin.storage.from('justificativas').remove(part)
    if (error) {
      console.warn('Storage (alguns arquivos):', error.message)
      continue
    }
    removed += part.length
  }
  return removed
}

console.log('Projeto:', url)
console.log(confirm ? 'Modo: EXECUÇÃO (--confirm)\n' : 'Modo: PRÉVIA (adicione --confirm para apagar)\n')

const { ids: estagiarioIds } = await countForEstagiarios('ponto_registros')
console.log(`Estagiários: ${estagiarioIds.length}`)

const tables = [
  ['notificacao_leituras', 'user_id'],
  ['notificacoes', 'user_id'],
  ['desafio_progressos', 'user_id'],
  ['justificativas', 'user_id'],
  ['ponto_registros', 'user_id'],
  ['bloqueios_presenca', 'user_id'],
]

for (const [table, col] of tables) {
  const { count } = await countForEstagiarios(table, col)
  console.log(`  ${table}: ${count}`)
}

if (!confirm) {
  console.log('\nNada foi alterado. Para executar: node scripts/db/reset-estagiarios-operational-data.mjs --confirm')
  process.exit(0)
}

if (estagiarioIds.length === 0) {
  console.log('\nNenhum estagiário; nada a fazer.')
  process.exit(0)
}

const { data: justRows, error: justErr } = await admin
  .from('justificativas')
  .select('arquivo_path')
  .in('user_id', estagiarioIds)
if (justErr) throw new Error(`justificativas paths: ${justErr.message}`)
const storagePaths = (justRows ?? []).map((r) => r.arquivo_path).filter(Boolean)

const order = [
  'notificacao_leituras',
  'notificacoes',
  'desafio_progressos',
  'justificativas',
  'ponto_registros',
  'bloqueios_presenca',
]

console.log('\nApagando…')
for (const table of order) {
  const n = await deleteIn(table, 'user_id', estagiarioIds)
  console.log(`  ✓ ${table}: ${n} linha(s)`)
}

const storageRemoved = await purgeJustificativaStorage(storagePaths)
console.log(`  ✓ storage justificativas: ${storageRemoved} arquivo(s) referenciado(s)`)

console.log('\nConcluído. Saldo e histórico passam a contar só a partir dos novos registros.')
console.log('Perfis, logins, gestores, configs e feriados foram mantidos.')
