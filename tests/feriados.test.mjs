import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isFeriado } from '../lib/server/services/feriado.service.ts'

const feriados = [
  { id: '1', data: '2026-01-01', nome: 'Confraternização', tipo: 'nacional', recorrente: true, createdAt: '' },
  { id: '2', data: '2026-12-25', nome: 'Natal', tipo: 'nacional', recorrente: true, createdAt: '' },
]

describe('isFeriado', () => {
  it('identifica data em feriado', async () => {
    assert.equal(await isFeriado('2026-01-01', feriados), true)
  })

  it('rejeita dia útil', async () => {
    assert.equal(await isFeriado('2026-06-10', feriados), false)
  })
})
