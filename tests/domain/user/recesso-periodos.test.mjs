import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { listRecessoPeriodos } from '../../../lib/domain/user/recesso-periodos.ts'

describe('listRecessoPeriodos', () => {
  it('retorna períodos com início e fim completos', () => {
    const periods = listRecessoPeriodos({
      dataInicioRecesso1: '2026-01-10',
      dataFimRecesso1: '2026-01-20',
      dataInicioRecesso2: null,
      dataFimRecesso2: null,
    })
    assert.equal(periods.length, 1)
    assert.deepEqual(periods[0], { numero: 1, inicio: '2026-01-10', fim: '2026-01-20' })
  })

  it('ignora período incompleto', () => {
    const periods = listRecessoPeriodos({
      dataInicioRecesso1: '2026-01-10',
      dataFimRecesso1: null,
      dataInicioRecesso2: '2026-07-01',
      dataFimRecesso2: '2026-07-15',
    })
    assert.equal(periods.length, 1)
    assert.equal(periods[0].numero, 2)
  })
})
