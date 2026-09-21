/** Formatação de textos e placeholders para a UI (sem travessão longo). */

const EM_DASH = '\u2014'

export function emptyCell(value: string | null | undefined, fallback = '-'): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export function emptyLabel(value: string | null | undefined, fallback = 'Não informado'): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

/** Substitui travessões em textos exibidos ao usuário. */
export function humanizeText(text: string): string {
  return text
    .split(EM_DASH)
    .map((part, index, parts) => {
      const trimmed = part.trim()
      if (index === 0) return trimmed
      const prevEndsSentence = /[.!?…]$/.test(parts[index - 1]?.trim() ?? '')
      const joiner = prevEndsSentence ? ' ' : ', '
      return `${joiner}${trimmed}`
    })
    .join('')
}
