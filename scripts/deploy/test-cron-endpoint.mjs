#!/usr/bin/env node
/**
 * Testa GET /api/cron/hr-reminders (local ou Render).
 * Uso:
 *   CRON_SECRET=... node scripts/deploy/test-cron-endpoint.mjs
 *   CRON_SECRET=... RENDER_BASE_URL=https://pointfy.onrender.com node scripts/deploy/test-cron-endpoint.mjs
 */
const secret = process.env.CRON_SECRET?.trim()
const base = (process.env.RENDER_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000')
  .trim()
  .replace(/\/$/, '')

if (!secret) {
  console.error('Defina CRON_SECRET')
  process.exit(1)
}

const url = `${base}/api/cron/hr-reminders`
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${secret}` },
})
const text = await res.text()
console.log(`${res.status} ${url}`)
console.log(text)
process.exit(res.ok ? 0 : 1)
