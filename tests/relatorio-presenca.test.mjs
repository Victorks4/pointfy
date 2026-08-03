import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { ANOTACAO_DATA_POSTERIOR } from '../lib/labels.ts'
import { buildObservacaoComAnotacao } from '../lib/presenca-anotacoes.ts'
import {
  buildRelatorioPresencaRows,
  getMonthDateKeys,
  stripAnotacaoDataPosterior,
} from '../lib/relatorio-presenca.ts'

describe('relatorio-presenca', () => {
  it('lista todos os dias do mês, inclusive fins de semana', () => {
    assert.deepEqual(getMonthDateKeys('2026', '02'), [
      '2026-02-01',
      '2026-02-02',
      '2026-02-03',
      '2026-02-04',
      '2026-02-05',
      '2026-02-06',
      '2026-02-07',
      '2026-02-08',
      '2026-02-09',
      '2026-02-10',
      '2026-02-11',
      '2026-02-12',
      '2026-02-13',
      '2026-02-14',
      '2026-02-15',
      '2026-02-16',
      '2026-02-17',
      '2026-02-18',
      '2026-02-19',
      '2026-02-20',
      '2026-02-21',
      '2026-02-22',
      '2026-02-23',
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
    ])
  })

  it('remove aviso de data posterior da observação', () => {
    assert.equal(
      stripAnotacaoDataPosterior(`${ANOTACAO_DATA_POSTERIOR}. Observação do estagiário`),
      'Observação do estagiário',
    )
    assert.equal(stripAnotacaoDataPosterior(ANOTACAO_DATA_POSTERIOR), null)
  })

  it('não adiciona mais aviso de data posterior ao salvar presença', () => {
    assert.equal(buildObservacaoComAnotacao('2026-03-01', 'Minha observação'), 'Minha observação')
    assert.equal(buildObservacaoComAnotacao('2026-03-01', null), null)
  })

  it('monta linhas do mês com registro, dia vazio e compensação', () => {
    const rows = buildRelatorioPresencaRows({
      year: '2026',
      month: '03',
      userId: 'user-1',
      pontos: [
        {
          id: 'p1',
          userId: 'user-1',
          data: '2026-03-02',
          entrada1: '08:00',
          saida1: '12:00',
          entrada2: '13:00',
          saida2: '17:00',
          totalMinutos: 480,
          observacao: `${ANOTACAO_DATA_POSTERIOR}. Registro retroativo`,
          justificativaHoraExtra: null,
          createdAt: '2026-03-03T10:00:00Z',
          updatedAt: '2026-03-03T10:00:00Z',
        },
      ],
      justificativas: [
        {
          id: 'j1',
          userId: 'user-1',
          data: '2026-03-05',
          tipo: 'compensacao',
          descricao: 'Falta compensada',
          arquivoUrl: null,
          minutosAbatidos: -360,
          createdAt: '2026-03-06T10:00:00Z',
          statusCompensacao: 'aprovada_gestor',
        },
        {
          id: 'j2',
          userId: 'user-1',
          data: '2026-03-10',
          tipo: 'compensacao_parcial',
          descricao: 'Compensação parcial',
          arquivoUrl: null,
          minutosAbatidos: -120,
          createdAt: '2026-03-11T10:00:00Z',
          dataCompensacao: '2026-03-12',
          minutosSolicitados: 120,
          statusCompensacao: 'aprovada_gestor',
        },
      ],
    })

    assert.equal(rows.length, 31)
    assert.equal(rows[0].data, '2026-03-01')
    assert.equal(rows[0].entrada1, null)
    assert.equal(rows[1].observacao, 'Registro retroativo')
    assert.equal(rows[4].observacao, 'Compensação integral')
    assert.equal(rows[11].observacao, 'Compensação parcial (2h)')
    assert.equal(rows[6].data, '2026-03-07')
    assert.equal(rows[6].entrada1, null)
  })
})
