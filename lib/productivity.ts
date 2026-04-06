import type { PontoRegistro } from './types'
import { timeToMinutes } from './time-utils'

export type ProductivityTier = {
  level: number
  label: string
  minScore: number
}

export const PRODUCTIVITY_TIERS: ProductivityTier[] = [
  { level: 1, label: 'Iniciante',    minScore: 0 },
  { level: 2, label: 'Consistente',  minScore: 26 },
  { level: 3, label: 'Dedicado',     minScore: 51 },
  { level: 4, label: 'Exemplar',     minScore: 76 },
]

export type ProductivityBreakdown = {
  consistency: number
  goalCompletion: number
  punctuality: number
}

export type ProductivityResult = {
  score: number
  tier: ProductivityTier
  nextTier: ProductivityTier | null
  breakdown: ProductivityBreakdown
}

const CONSISTENCY_WEIGHT = 0.4
const GOAL_WEIGHT = 0.35
const PUNCTUALITY_WEIGHT = 0.25

const WORK_DAYS_PER_MONTH = 22
const PUNCTUALITY_THRESHOLD = '09:00'

function getTierForScore(score: number): ProductivityTier {
  for (let i = PRODUCTIVITY_TIERS.length - 1; i >= 0; i--) {
    if (score >= PRODUCTIVITY_TIERS[i].minScore) return PRODUCTIVITY_TIERS[i]
  }
  return PRODUCTIVITY_TIERS[0]
}

function getNextTier(current: ProductivityTier): ProductivityTier | null {
  const idx = PRODUCTIVITY_TIERS.findIndex(t => t.level === current.level)
  if (idx < PRODUCTIVITY_TIERS.length - 1) return PRODUCTIVITY_TIERS[idx + 1]
  return null
}

export function computeProductivityScore(
  pontos: PontoRegistro[],
  streak: number,
  metaDiaria: number,
): ProductivityResult {
  if (pontos.length === 0) {
    const tier = PRODUCTIVITY_TIERS[0]
    return {
      score: 0,
      tier,
      nextTier: getNextTier(tier),
      breakdown: { consistency: 0, goalCompletion: 0, punctuality: 0 },
    }
  }

  const consistencyRaw = Math.min((streak / WORK_DAYS_PER_MONTH) * 100, 100)

  const diasComMeta = pontos.filter(p => p.totalMinutos >= metaDiaria).length
  const goalCompletionRaw = Math.min((diasComMeta / pontos.length) * 100, 100)

  const threshold = timeToMinutes(PUNCTUALITY_THRESHOLD)
  const diasPontuais = pontos.filter(p => {
    if (!p.entrada1) return false
    return timeToMinutes(p.entrada1) <= threshold
  }).length
  const punctualityRaw = Math.min((diasPontuais / pontos.length) * 100, 100)

  const score = Math.round(
    consistencyRaw * CONSISTENCY_WEIGHT +
    goalCompletionRaw * GOAL_WEIGHT +
    punctualityRaw * PUNCTUALITY_WEIGHT
  )

  const clampedScore = Math.min(Math.max(score, 0), 100)
  const tier = getTierForScore(clampedScore)

  return {
    score: clampedScore,
    tier,
    nextTier: getNextTier(tier),
    breakdown: {
      consistency: Math.round(consistencyRaw),
      goalCompletion: Math.round(goalCompletionRaw),
      punctuality: Math.round(punctualityRaw),
    },
  }
}
