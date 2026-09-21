#!/usr/bin/env node
/**
 * Valida variáveis obrigatórias para deploy em produção (Render, Vercel, etc.).
 * Uso: npm run deploy:preflight
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
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

const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim()
if (!siteUrl || siteUrl.includes('pointfy.vercel.app')) {
  console.warn(
    '⚠ NEXT_PUBLIC_SITE_URL ausente ou ainda aponta para Vercel — use a URL Render/domínio de produção',
  )
} else if (!/^https:\/\//i.test(siteUrl)) {
  console.warn('⚠ NEXT_PUBLIC_SITE_URL deve ser https:// em produção')
} else {
  console.log(`✓ NEXT_PUBLIC_SITE_URL (${siteUrl})`)
}

if (!ok) {
  console.error('\nCorrija .env.local ou as env vars do host antes do deploy.')
  process.exit(1)
}

const emailOk =
  Boolean(env.RESEND_API_KEY?.trim()) || Boolean(env.SMTP_HOST?.trim())
if (emailOk) {
  console.log('✓ E-mail de atestados (RESEND_API_KEY ou SMTP_HOST)')
} else {
  console.warn('⚠ E-mail de atestados não configurado (RESEND_API_KEY ou SMTP_HOST)')
}

if (!env.CRON_SECRET?.trim()) {
  console.warn('⚠ CRON_SECRET ausente — lembretes HR via /api/cron/hr-reminders não rodarão')
} else {
  console.log('✓ CRON_SECRET')
}

console.log('\n✅ Preflight OK — pronto para build/deploy.')
if (envPath) console.log(`   (lido de ${envPath})`)
