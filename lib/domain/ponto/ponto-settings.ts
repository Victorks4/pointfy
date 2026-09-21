export type PontoSettings = {
  formatoDecimal: 'americano' | 'brasileiro'
  rejeitarMinutosZero: boolean
}

const STORAGE_KEY = 'pointfy:pontoSettings'

const DEFAULT_SETTINGS: PontoSettings = {
  formatoDecimal: 'americano',
  rejeitarMinutosZero: true,
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export function getPontoSettings(): PontoSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_SETTINGS

  const parsed = safeParseJson(raw) as Partial<PontoSettings> | null
  if (!parsed) return DEFAULT_SETTINGS

  return {
    formatoDecimal: parsed.formatoDecimal === 'brasileiro' ? 'brasileiro' : 'americano',
    rejeitarMinutosZero: typeof parsed.rejeitarMinutosZero === 'boolean' ? parsed.rejeitarMinutosZero : true,
  }
}

export function setPontoSettings(settings: PontoSettings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

