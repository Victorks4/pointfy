import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canAccessUserData,
  assertCanAccessUserData,
} from '../lib/server/access-control.ts'

const estagiario = {
  id: 'est-1',
  cargo: 'estagiario',
  gestorId: 'gestor-1',
}
const gestor = { id: 'gestor-1', cargo: 'gestor', gestorId: null }
const admin = { id: 'admin-1', cargo: 'admin', gestorId: null }
const outroEst = { id: 'est-2', cargo: 'estagiario', gestorId: 'gestor-2' }

describe('canAccessUserData', () => {
  it('estagiário acessa apenas o próprio id', () => {
    assert.equal(canAccessUserData(estagiario, 'est-1', 'gestor-1'), true)
    assert.equal(canAccessUserData(estagiario, 'est-2', 'gestor-2'), false)
  })

  it('gestor acessa estagiários da equipe', () => {
    assert.equal(canAccessUserData(gestor, 'est-1', 'gestor-1'), true)
    assert.equal(canAccessUserData(gestor, 'est-2', 'gestor-2'), false)
  })

  it('admin acessa qualquer usuário', () => {
    assert.equal(canAccessUserData(admin, 'est-2', 'gestor-2'), true)
  })
})

describe('assertCanAccessUserData', () => {
  it('lança Sem permissão quando negado', () => {
    assert.throws(
      () => assertCanAccessUserData(estagiario, 'est-2', 'gestor-2'),
      /Sem permissão/,
    )
  })
})
