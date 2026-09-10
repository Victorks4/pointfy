import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isRecessApproaching, ALERTA_ANTECEDENCIA_DIAS } from '../lib/time-utils.ts'

describe('hr-scheduler constants', () => {
  it('alerta de antecedência é 30 dias', () => {
    assert.equal(ALERTA_ANTECEDENCIA_DIAS, 30)
  })
})

describe('isRecessApproaching para alertas', () => {
  it('detecta data em 30 dias', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(today)
    target.setDate(target.getDate() + 30)
    const key = target.toISOString().split('T')[0]
    assert.equal(isRecessApproaching(key, 30), true)
  })

  it('ignora data no passado', () => {
    assert.equal(isRecessApproaching('2020-01-01', 30), false)
  })
})
