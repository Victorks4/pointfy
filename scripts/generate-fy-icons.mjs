/**
 * Gera favicon e ícones do app a partir de public/fy-mascote.png
 * Uso: node scripts/generate-fy-icons.mjs
 */
import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdir } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const src = resolve(root, 'public/fy-mascote.png')
const appDir = resolve(root, 'app')
const publicDir = resolve(root, 'public')

const MASTER = 512
const PADDING = 0.14
/** Fundo suave — contraste com o mascote azul sem “sumir” na aba */
const BG = { r: 240, g: 246, b: 255, alpha: 1 }
const RADIUS_RATIO = 0.2

async function roundedSquarePng(buffer, size) {
  const radius = Math.round(size * RADIUS_RATIO)
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`,
  )
  return sharp(buffer)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
}

async function buildMasterIcon() {
  const trimmed = await sharp(src).trim({ threshold: 12 }).toBuffer()
  const content = Math.round(MASTER * (1 - PADDING * 2))

  const mascot = await sharp(trimmed)
    .resize(content, content, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  const flat = await sharp({
    create: {
      width: MASTER,
      height: MASTER,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: mascot, gravity: 'center' }])
    .png()
    .toBuffer()

  return roundedSquarePng(flat, MASTER)
}

async function main() {
  await mkdir(appDir, { recursive: true })
  const master = await buildMasterIcon()

  await sharp(master).png().toFile(resolve(appDir, 'icon.png'))
  await sharp(master).resize(180, 180).png().toFile(resolve(appDir, 'apple-icon.png'))
  await sharp(master).resize(32, 32).png().toFile(resolve(publicDir, 'icon-32.png'))
  await sharp(master).resize(16, 16).png().toFile(resolve(publicDir, 'icon-16.png'))

  console.log('Ícones gerados:')
  console.log('  app/icon.png (512)')
  console.log('  app/apple-icon.png (180)')
  console.log('  public/icon-32.png, public/icon-16.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
