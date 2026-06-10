import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  compensacaoAfetaSaldo,
  minutosCompensacaoEfetivos,
} from '../lib/compensacao-utils.ts'
import { MINUTOS_COMPENSACAO } from '../lib/types.ts'

const base = {
  id: 'j1',
  userId: 'u1',
  data: '2024-06-10',
  descricao: 'teste',
  arquivoUrl: null,
  createdAt: '',
}

describe('compensacaoAfetaSaldo', () => {
  it('ignora atestado', () => {
    assert.equal(compensacaoAfetaSaldo({ ...base, tipo: 'atestado' }), false)
  })

  it('só compensação aprovada afeta saldo', () => {
    assert.equal(
      compensacaoAfetaSaldo({
        ...base,
        tipo: 'compensacao',
        statusCompensacao: 'pendente_gestor',
        minutosAbatidos: 0,
      }),
      false,
    )
    assert.equal(
      compensacaoAfetaSaldo({
        ...base,
        tipo: 'compensacao',
        statusCompensacao: 'aprovada_gestor',
        minutosAbatidos: -MINUTOS_COMPENSACAO,
      }),
      true,
    )
  })
})

describe('minutosCompensacaoEfetivos', () => {
  it('usa minutosAbatidos quando definido', () => {
    assert.equal(
      minutosCompensacaoEfetivos({
        ...base,
        tipo: 'compensacao',
        statusCompensacao: 'aprovada_gestor',
        minutosAbatidos: -120,
      }),
      -120,
    )
  })

  it('fallback para MINUTOS_COMPENSACAO quando aprovada sem minutos', () => {
    assert.equal(
      minutosCompensacaoEfetivos({
        ...base,
        tipo: 'compensacao',
        statusCompensacao: 'aprovada_gestor',
        minutosAbatidos: 0,
      }),
      -MINUTOS_COMPENSACAO,
    )
  })
})
