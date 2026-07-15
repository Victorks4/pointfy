import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularSequenciaAtual } from '../lib/time-utils.ts'

// 2026-07-10 = sexta, 2026-07-11 = sábado, 2026-07-12 = domingo, 2026-07-13 = segunda
const SEXTA = '2026-07-10'
const SABADO = '2026-07-11'
const SEGUNDA = '2026-07-13'
const QUINTA = '2026-07-09'

describe('calcularSequenciaAtual', () => {
  it('conta sexta e segunda sem registro no fim de semana', () => {
    assert.equal(calcularSequenciaAtual([SEXTA, SEGUNDA], SEGUNDA), 2)
  })

  it('mantém sequência viva com último ponto na sexta e hoje segunda', () => {
    assert.equal(calcularSequenciaAtual([SEXTA], SEGUNDA), 1)
  })

  it('zera sequência quando falta dia útil entre quinta e segunda', () => {
    assert.equal(calcularSequenciaAtual([QUINTA], SEGUNDA), 0)
  })

  it('conta três dias úteis consecutivos quinta-sexta-segunda', () => {
    assert.equal(calcularSequenciaAtual([QUINTA, SEXTA, SEGUNDA], SEGUNDA), 3)
  })

  it('ignora registro apenas no sábado', () => {
    assert.equal(calcularSequenciaAtual([SABADO], SEGUNDA), 0)
  })

  it('retorna 0 sem datas', () => {
    assert.equal(calcularSequenciaAtual([]), 0)
  })

  it('retorna 0 quando faltam dias úteis entre o último registro e hoje', () => {
    assert.equal(calcularSequenciaAtual(['2026-07-08'], SEGUNDA), 0)
  })
})
