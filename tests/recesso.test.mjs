import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isInRecessPeriod,
  isUserInRecessPeriod,
  isAnyRecessApproaching,
} from '../lib/time-utils.ts'

const user = {
  dataInicioRecesso1: '2026-01-10',
  dataFimRecesso1: '2026-01-20',
  dataInicioRecesso2: '2026-07-01',
  dataFimRecesso2: '2026-07-15',
}

describe('isInRecessPeriod', () => {
  it('dentro do intervalo', () => {
    assert.equal(isInRecessPeriod('2026-01-15', '2026-01-10', '2026-01-20'), true)
  })

  it('fora do intervalo', () => {
    assert.equal(isInRecessPeriod('2026-02-01', '2026-01-10', '2026-01-20'), false)
  })

  it('primeiro dia inclusivo', () => {
    assert.equal(isInRecessPeriod('2026-01-10', '2026-01-10', '2026-01-20'), true)
  })

  it('último dia inclusivo', () => {
    assert.equal(isInRecessPeriod('2026-01-20', '2026-01-10', '2026-01-20'), true)
  })

  it('dia anterior ao início', () => {
    assert.equal(isInRecessPeriod('2026-01-09', '2026-01-10', '2026-01-20'), false)
  })

  it('dia após o fim', () => {
    assert.equal(isInRecessPeriod('2026-01-21', '2026-01-10', '2026-01-20'), false)
  })

  it('período incompleto — só início', () => {
    assert.equal(isInRecessPeriod('2026-01-15', '2026-01-10', null), false)
  })

  it('período incompleto — só fim', () => {
    assert.equal(isInRecessPeriod('2026-01-15', null, '2026-01-20'), false)
  })
})

describe('isUserInRecessPeriod', () => {
  it('detecta recesso 1', () => {
    assert.equal(isUserInRecessPeriod('2026-01-12', user), true)
  })

  it('detecta recesso 2', () => {
    assert.equal(isUserInRecessPeriod('2026-07-10', user), true)
  })

  it('fora dos dois recessos', () => {
    assert.equal(isUserInRecessPeriod('2026-03-01', user), false)
  })

  it('primeiro dia do recesso 1', () => {
    assert.equal(isUserInRecessPeriod('2026-01-10', user), true)
  })

  it('último dia do recesso 1', () => {
    assert.equal(isUserInRecessPeriod('2026-01-20', user), true)
  })

  it('primeiro dia do recesso 2', () => {
    assert.equal(isUserInRecessPeriod('2026-07-01', user), true)
  })

  it('último dia do recesso 2', () => {
    assert.equal(isUserInRecessPeriod('2026-07-15', user), true)
  })

  it('bloqueia em sobreposição de recessos', () => {
    const overlapUser = {
      dataInicioRecesso1: '2026-06-01',
      dataFimRecesso1: '2026-06-30',
      dataInicioRecesso2: '2026-06-15',
      dataFimRecesso2: '2026-07-15',
    }
    assert.equal(isUserInRecessPeriod('2026-06-20', overlapUser), true)
  })
})

describe('isAnyRecessApproaching', () => {
  it('retorna true quando recesso 2 está próximo', () => {
    const hoje = new Date('2026-06-28')
    const original = Date
    global.Date = class extends original {
      constructor(...args) {
        if (args.length === 0) super(hoje)
        else super(...args)
      }
      static now() {
        return hoje.getTime()
      }
    }
    try {
      assert.equal(isAnyRecessApproaching(user, 15), true)
    } finally {
      global.Date = original
    }
  })
})
