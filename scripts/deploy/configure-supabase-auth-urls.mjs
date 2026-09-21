#!/usr/bin/env node
/**
 * Aplica Site URL e Redirect URLs no Supabase (Management API).
 * Requer: npx supabase login (ou SUPABASE_ACCESS_TOKEN)
 *
 * URL do app: NEXT_PUBLIC_SITE_URL ou PRODUCTION_URL (sem barra final).
 */
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function loadEnvFile(rel) {
  const path = resolve(root, rel)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF?.trim() || 'cnkhzfphbkswiasgalww'

const siteRaw =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.PRODUCTION_URL?.trim() ||
  ''

if (!siteRaw) {
  console.error(
    'Defina NEXT_PUBLIC_SITE_URL (ex.: https://pointfy.onrender.com) em .env.local ou no ambiente.',
  )
  process.exit(1)
}

const SITE_URL = siteRaw.replace(/\/$/, '')
const REDIRECT_URLS = [
  `${SITE_URL}/auth/callback`,
  `${SITE_URL}/**`,
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/**',
]

const extra = process.env.SUPABASE_EXTRA_REDIRECT_URLS?.trim()
if (extra) {
  for (const part of extra.split(',')) {
    const u = part.trim()
    if (u && !REDIRECT_URLS.includes(u)) REDIRECT_URLS.push(u)
  }
}

function readAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim()
  }

  const candidates = [
    join(homedir(), '.supabase', 'access-token'),
    join(process.env.APPDATA ?? '', 'supabase', 'access-token'),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, 'utf8').trim()
    }
  }

  return null
}

const token = readAccessToken()
if (!token) {
  console.error('Token não encontrado. Rode: npx supabase login')
  process.exit(1)
}

const body = {
  site_url: SITE_URL,
  uri_allow_list: REDIRECT_URLS.join(','),
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

if (!res.ok) {
  const text = await res.text()
  console.error(`Falha ao atualizar auth config (${res.status}):`, text)
  process.exit(1)
}

console.log('✅ Supabase Auth configurado:')
console.log(`   Projeto: ${PROJECT_REF}`)
console.log(`   Site URL: ${SITE_URL}`)
for (const url of REDIRECT_URLS) {
  console.log(`   Redirect: ${url}`)
}
