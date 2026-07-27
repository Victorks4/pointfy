#!/usr/bin/env node
/**
 * Aplica Site URL e Redirect URLs no Supabase (produção Pontify).
 * Usa o token da CLI (`supabase login`) via Management API.
 */
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PROJECT_REF = 'royszemnvodpzhwswpmm'
const SITE_URL = 'https://pointfy.vercel.app'
const REDIRECT_URLS = [
  'https://pointfy.vercel.app/auth/callback',
  'https://pointfy.vercel.app/**',
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/**',
]

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
console.log(`   Site URL: ${SITE_URL}`)
for (const url of REDIRECT_URLS) {
  console.log(`   Redirect: ${url}`)
}
