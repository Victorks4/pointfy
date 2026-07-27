import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeInternalRedirectPath } from '../lib/auth/safe-redirect.ts'
import { LOTACOES } from '../lib/lotacoes.ts'
import { usuarioInputSchema } from '../lib/validations/schemas.ts'

describe('sanitizeInternalRedirectPath recovery', () => {
  it('aceita rota de redefinição de senha', () => {
    assert.equal(
      sanitizeInternalRedirectPath('/auth/redefinir-senha'),
      '/auth/redefinir-senha',
    )
  })
})

describe('LOTACOES ordenação', () => {
  it('está em ordem alfabética pt-BR', () => {
    const sorted = [...LOTACOES].sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    )
    assert.deepEqual([...LOTACOES], sorted)
  })
})

describe('usuarioInputSchema gestor sem carga horária', () => {
  const gestorBase = {
    email: 'gestor@empresa.com',
    senha: 'senha123',
    matricula: 'GES001',
    nome: 'Gestor Teste',
    cargo: 'gestor',
    departamento: LOTACOES[0],
    dataInicioRecesso1: null,
    dataFimRecesso1: null,
    dataInicioRecesso2: null,
    dataFimRecesso2: null,
  }

  it('aceita gestor sem cargaHorariaSemanal', () => {
    const parsed = usuarioInputSchema.safeParse(gestorBase)
    assert.equal(parsed.success, true)
  })

  it('rejeita estagiário sem cargaHorariaSemanal', () => {
    const parsed = usuarioInputSchema.safeParse({
      ...gestorBase,
      cargo: 'estagiario',
      gestorId: '00000000-0000-4000-8000-000000000001',
      horarioTrabalhoEntrada1: '08:00',
      horarioTrabalhoSaida1: '12:00',
      horarioTrabalhoEntrada2: '13:00',
      horarioTrabalhoSaida2: '17:00',
    })
    assert.equal(parsed.success, false)
  })
})
