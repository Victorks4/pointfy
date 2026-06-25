#!/usr/bin/env node
/**
 * Sincroniza variáveis do .env local para o projeto Vercel (production, preview, development).
 * Não imprime valores dos secrets.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const envPath = [resolve(root, '.env'), resolve(root, '.env.local')].find((p) =>
  existsSync(p),
)

if (!envPath) {
  console.error('Nenhum .env ou .env.local encontrado.')
  process.exit(1)
}

function loadEnvFile(path) {
  const vars = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    vars[key] = val
  }
  return vars
}

const vars = loadEnvFile(envPath)
const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const targets = ['production', 'preview', 'development']

function addEnv(name, value, target) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'npx',
      ['vercel@latest', 'env', 'add', name, target, '--force', '--yes'],
      {
        cwd: root,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      },
    )
    let err = ''
    child.stderr.on('data', (d) => {
      err += d.toString()
    })
    child.stdin.write(value)
    child.stdin.end()
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(err || `exit ${code}`))
    })
  })
}

for (const key of keys) {
  const value = vars[key]?.trim()
  if (!value) {
    console.error(`✗ ${key} ausente em ${envPath}`)
    process.exit(1)
  }
}

console.log(`Sincronizando ${keys.length} variáveis a partir de ${envPath}…`)

for (const key of keys) {
  for (const target of targets) {
    process.stdout.write(`  ${key} → ${target}… `)
    try {
      await addEnv(key, vars[key], target)
      console.log('ok')
    } catch (e) {
      console.log('falhou')
      console.error(e.message)
      process.exit(1)
    }
  }
}

console.log('\n✅ Variáveis enviadas para a Vercel.')
