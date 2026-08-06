#!/usr/bin/env node
/**
 * Valida variáveis obrigatórias para deploy (Vercel / produção).
 * Uso: node scripts/vercel-preflight.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const envPath = [resolve(root, '.env.local'), resolve(root, '.env')].find((p) =>
  existsSync(p),
)

function loadEnvFile(path) {
  const vars = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

const fromFile = envPath ? loadEnvFile(envPath) : {}
const env = { ...fromFile, ...process.env }

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

let ok = true
for (const key of required) {
  const val = env[key]?.trim()
  if (!val || val.includes('sua-') || val.includes('seu-projeto')) {
    console.error(`✗ ${key} ausente ou placeholder`)
    ok = false
  } else {
    console.log(`✓ ${key}`)
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
if (url && /\/rest\/v1/i.test(url)) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL não deve conter /rest/v1')
  ok = false
}

if (!ok) {
  console.error('\nCorrija .env.local ou as env vars na Vercel antes do deploy.')
  process.exit(1)
}

const emailOk =
  Boolean(env.RESEND_API_KEY?.trim()) || Boolean(env.SMTP_HOST?.trim())
if (emailOk) {
  console.log('✓ E-mail de atestados (RESEND_API_KEY ou SMTP_HOST)')
} else {
  console.warn('⚠ E-mail de atestados não configurado (RESEND_API_KEY ou SMTP_HOST)')
}

console.log('\n✅ Preflight OK — pronto para build/deploy na Vercel.')
if (envPath) console.log(`   (lido de ${envPath})`)
