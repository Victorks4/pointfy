/**
 * Vídeo do Fy com fundo branco de estúdio (ex.: PixVerse).
 * Ajuste fino: FY_VIDEO_CHROMA_THRESHOLD (maior = remove mais pixels claros).
 */

/** Chave branca — fundo liso do vídeo. */
export const FY_VIDEO_CHROMA_KEY_RGB: [number, number, number] = [255, 255, 255]

/**
 * Distância normalizada até a chave; só o que for “quase branco” some.
 * ~0.08–0.12 costuma funcionar; se o personagem sumir nas bordas, baixe.
 */
export const FY_VIDEO_CHROMA_THRESHOLD = 0.095

/** Recorte do frame de origem (marca d’água / margens). */
export const FY_VIDEO_CROP_TOP_RATIO = 0.07
export const FY_VIDEO_CROP_LEFT_RATIO = 0
export const FY_VIDEO_CROP_RIGHT_RATIO = 0.14
export const FY_VIDEO_CROP_BOTTOM_RATIO = 0.05

/** `NEXT_PUBLIC_FY_VIDEO_CHROMA=0` desliga o chroma. */
export function isFyVideoChromaEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FY_VIDEO_CHROMA === '0') {
    return false
  }
  return true
}

function chromaDistance(r: number, g: number, b: number, key: [number, number, number]): number {
  const dr = (r - key[0]) / 255
  const dg = (g - key[1]) / 255
  const db = (b - key[2]) / 255
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Remove pixels de fundo branco/cinza-claro sem atacar o azul do corpo
 * (rosto claro do relógio tem mais saturação que o fundo).
 */
export function isFyVideoBackgroundPixel(r: number, g: number, b: number): boolean {
  const key = FY_VIDEO_CHROMA_KEY_RGB
  const dist = chromaDistance(r, g, b, key)
  if (dist < FY_VIDEO_CHROMA_THRESHOLD) return true

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max === 0 ? 0 : (max - min) / max
  const lum = (r + g + b) / 3

  if (lum < 252) return false
  if (sat > 0.045) return false

  return true
}
