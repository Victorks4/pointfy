import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  pontosInflightKey,
  justificativasInflightKey,
} from '../lib/data-api.ts'

describe('pontosInflightKey', () => {
  it('diferencia userId', () => {
    assert.notEqual(
      pontosInflightKey({ userId: 'a' }),
      pontosInflightKey({ userId: 'b' }),
    )
  })

  it('diferencia intervalo de datas', () => {
    assert.notEqual(
      pontosInflightKey({ from: '2026-01-01', to: '2026-01-31' }),
      pontosInflightKey({ from: '2026-02-01', to: '2026-02-28' }),
    )
  })

  it('usa chave default sem params', () => {
    assert.equal(pontosInflightKey(), '__default__')
  })
})

describe('justificativasInflightKey', () => {
  it('diferencia flags rh e sign', () => {
    assert.notEqual(
      justificativasInflightKey({ rh: true }),
      justificativasInflightKey({ sign: true }),
    )
  })
})
