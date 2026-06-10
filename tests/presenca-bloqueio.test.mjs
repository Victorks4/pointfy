import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  dateKeyInRange,
  isPresencaBloqueada,
} from '../lib/presenca-bloqueio.ts'

describe('dateKeyInRange', () => {
  it('inclui datas dentro do intervalo', () => {
    assert.equal(dateKeyInRange('2024-06-15', '2024-06-10', '2024-06-20'), true)
  })

  it('exclui datas fora do intervalo', () => {
    assert.equal(dateKeyInRange('2024-06-05', '2024-06-10', '2024-06-20'), false)
  })

  it('dia único quando fim é null', () => {
    assert.equal(dateKeyInRange('2024-06-10', '2024-06-10', null), true)
    assert.equal(dateKeyInRange('2024-06-11', '2024-06-10', null), false)
  })
})

describe('isPresencaBloqueada', () => {
  const bloqueios = [
    {
      id: 'b1',
      userId: 'u1',
      dataInicio: '2024-06-10',
      dataFim: '2024-06-12',
      motivo: 'x',
      createdAt: '',
    },
  ]

  it('bloqueia usuário na data', () => {
    assert.equal(isPresencaBloqueada(bloqueios, 'u1', '2024-06-11'), true)
  })

  it('não bloqueia outro usuário', () => {
    assert.equal(isPresencaBloqueada(bloqueios, 'u2', '2024-06-11'), false)
  })

  it('não bloqueia fora do período', () => {
    assert.equal(isPresencaBloqueada(bloqueios, 'u1', '2024-06-20'), false)
  })
})
