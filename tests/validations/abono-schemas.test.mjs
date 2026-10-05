import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { abonoInputSchema } from '../../lib/validations/schemas.ts'

describe('abonoInputSchema', () => {
  const base = {
    estagiarioId: '7229e3b9-0ab0-4a92-9d12-e53eed45dc09',
    data: '2026-04-01',
    minutos: 120,
    descricao: 'Ajuste autorizado pelo gestor',
  }

  it('aceita abono válido', () => {
    assert.equal(abonoInputSchema.safeParse(base).success, true)
  })

  it('rejeita minutos zero', () => {
    assert.equal(abonoInputSchema.safeParse({ ...base, minutos: 0 }).success, false)
  })
})
