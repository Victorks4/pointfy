import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getGestorNomes } from '../lib/gestor-utils.ts'
import { emptyLabel } from '../lib/display-utils.ts'

const estagiario = {
  id: 'est-1',
  gestorId: 'gestor-1',
  gestorIds: ['gestor-2'],
}

const usuarios = [
  estagiario,
  { id: 'gestor-1', nome: 'Maria Gestora' },
  { id: 'gestor-2', nome: 'João Supervisor' },
]

describe('getGestorNomes', () => {
  it('resolve nomes a partir de gestorId e gestorIds', () => {
    assert.equal(getGestorNomes(estagiario, usuarios), 'Maria Gestora, João Supervisor')
  })

  it('retorna Não informado quando gestores não estão em usuarios', () => {
    assert.equal(getGestorNomes(estagiario, [estagiario]), emptyLabel(null))
  })

  it('usa gestorIds da junction quando gestorId é null', () => {
    const onlyJunction = { id: 'est-1', gestorId: null, gestorIds: ['gestor-2'] }
    assert.equal(getGestorNomes(onlyJunction, usuarios), 'João Supervisor')
  })
})
