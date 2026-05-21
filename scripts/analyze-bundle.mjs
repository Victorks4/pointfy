#!/usr/bin/env node
/**
 * Analisa chunks do Next.js após build.
 * Uso: npm run build && npm run analyze
 *      npm run analyze -- --build   (roda build antes)
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const chunksDir = path.join(root, '.next', 'static', 'chunks')
const reportsDir = path.join(root, 'reports')

const HEAVY_HINTS = [
  'jspdf',
  'framer-motion',
  'framework',
  'main-app',
  'vendor',
  'three',
  'recharts',
  'lucide',
]

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function collectFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) collectFiles(full, acc)
    else if (/\.(js|css)$/.test(name)) acc.push(full)
  }
  return acc
}

function analyze() {
  const files = collectFiles(chunksDir)
  if (files.length === 0) {
    console.error('\n❌ Nenhum chunk em .next/static/chunks. Rode: npm run build\n')
    process.exit(1)
  }

  const rows = files.map((file) => {
    const buf = fs.readFileSync(file)
    const gzip = gzipSync(buf).length
    return {
      file: path.relative(root, file).replace(/\\/g, '/'),
      raw: buf.length,
      gzip,
      name: path.basename(file),
    }
  })

  rows.sort((a, b) => b.raw - a.raw)
  const top = rows.slice(0, 15)
  const totalRaw = rows.reduce((s, r) => s + r.raw, 0)
  const totalGzip = rows.reduce((s, r) => s + r.gzip, 0)

  console.log('\n📦 Pointfy — Análise de bundle (chunks estáticos)\n')
  console.log(`Total: ${formatBytes(totalRaw)} (bruto) · ~${formatBytes(totalGzip)} (gzip estimado)\n`)
  console.log('Top 15 chunks:\n')
  console.log('  Tamanho (gzip)   Tamanho (raw)   Arquivo')
  console.log('  ' + '-'.repeat(72))

  for (const row of top) {
    const hint = HEAVY_HINTS.some((h) => row.name.includes(h) || row.file.includes(h)) ? ' ⚠' : ''
    console.log(
      `  ${formatBytes(row.gzip).padStart(12)}   ${formatBytes(row.raw).padStart(12)}   ${row.file}${hint}`,
    )
  }

  const heavy = rows.filter((r) =>
    HEAVY_HINTS.some((h) => r.name.toLowerCase().includes(h)),
  )
  if (heavy.length) {
    console.log('\nDependências / chunks pesados detectados:')
    for (const r of heavy.slice(0, 8)) {
      console.log(`  · ${r.file} (${formatBytes(r.gzip)} gzip)`)
    }
  }

  fs.mkdirSync(reportsDir, { recursive: true })
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRaw,
    totalGzip,
    chunkCount: rows.length,
    top15: top,
    heavyHints: heavy.map((r) => ({ file: r.file, raw: r.raw, gzip: r.gzip })),
  }
  const outPath = path.join(reportsDir, 'bundle-summary.json')
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2))
  console.log(`\n✅ Resumo salvo em ${path.relative(root, outPath)}\n`)
}

const shouldBuild = process.argv.includes('--build')
if (shouldBuild) {
  console.log('🔨 Executando next build...\n')
  const r = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

analyze()
