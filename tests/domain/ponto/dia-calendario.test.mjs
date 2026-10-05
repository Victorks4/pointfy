import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAnotacaoDiaNaoUtil,
  isWeekend,
  resolveFeriadoNoDia,
} from '../../../lib/domain/ponto/dia-calendario.ts'

describe('dia-calendario', () => {
  it('identifica fim de semana', () => {
    assert.equal(isWeekend('2026-03-07'), true)
    assert.equal(isWeekend('2026-03-09'), false)
  })

  it('resolve feriado fixo e recorrente', () => {
    const feriados = [
      {
        id: '1',
        data: '2026-01-01',
        nome: 'Ano Novo',
        tipo: 'nacional',
        recorrente: true,
        createdAt: '',
      },
    ]
    assert.equal(resolveFeriadoNoDia('2026-01-01', feriados)?.nome, 'Ano Novo')
    assert.equal(resolveFeriadoNoDia('2027-01-01', feriados)?.nome, 'Ano Novo')
  })

  it('prioriza feriado sobre fim de semana', () => {
    const feriados = [
      {
        id: '1',
        data: '2026-07-02',
        nome: 'Independência da Bahia',
        tipo: 'municipal',
        recorrente: true,
        createdAt: '',
      },
    ]
    const note = getAnotacaoDiaNaoUtil({
      dateKey: '2026-07-02',
      feriados,
      user: null,
    })
    assert.match(note ?? '', /Feriado/)
  })
})
