import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validatePontoBusinessRules } from '../lib/server/validators/ponto.validator'

const baseUser = {
  id: 'user-1',
  email: 'e@test.com',
  ra: 'RA1',
  nome: 'Teste',
  cargo: 'estagiario',
  departamento: 'TI',
  cargaHorariaSemanal: 1800,
  dataInicioRecesso: null,
  dataFimRecesso: null,
  gestorId: 'gestor-1',
  createdAt: '2024-01-01T00:00:00Z',
}

const baseConfig = {
  id: 'cfg-1',
  nome: 'Padrão',
  metaDiariaMinutos: 360,
  limiteMinutosSemJustificativa: 370,
  rejeitarMinutosZero: true,
  formatoDecimal: 'americano',
  horarioEntradaEsperado: '09:00',
  ativo: true,
  padrao: true,
  createdAt: '2024-01-01T00:00:00Z',
}

const ctx = {
  user: baseUser,
  bloqueios: [],
  activeConfig: baseConfig,
}

describe('validatePontoBusinessRules', () => {
  it('rejeita totalMinutos diferente do calculado', () => {
    const erros = validatePontoBusinessRules(
      {
        data: '2024-06-10',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:15',
        totalMinutos: 999,
        justificativaHoraExtra: null,
      },
      ctx,
    )
    assert.ok(erros.some((e) => e.includes('inconsistente')))
  })

  it('exige justificativa acima de meta + 1h (7h quando meta é 6h)', () => {
    const erros = validatePontoBusinessRules(
      {
        data: '2024-06-10',
        entrada1: '08:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '19:15',
        totalMinutos: 480,
        justificativaHoraExtra: null,
      },
      ctx,
    )
    assert.ok(erros.some((e) => e.includes('justificativa')))
  })

  it('não exige justificativa entre meta e meta+1h (ex.: 6h10)', () => {
    const erros = validatePontoBusinessRules(
      {
        data: '2024-06-10',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:25',
        totalMinutos: 370,
        justificativaHoraExtra: null,
      },
      ctx,
    )
    assert.ok(!erros.some((e) => e.includes('justificativa')))
  })

  it('rejeita data futura', () => {
    const erros = validatePontoBusinessRules(
      {
        data: '2099-12-31',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:15',
        totalMinutos: 360,
        justificativaHoraExtra: null,
      },
      ctx,
    )
    assert.ok(erros.some((e) => e.includes('futura')))
  })

  it('rejeita registro em data bloqueada', () => {
    const erros = validatePontoBusinessRules(
      {
        data: '2024-06-10',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:15',
        totalMinutos: 360,
        justificativaHoraExtra: null,
      },
      {
        ...ctx,
        bloqueios: [
          {
            id: 'b1',
            userId: 'user-1',
            dataInicio: '2024-06-10',
            dataFim: '2024-06-10',
            motivo: 'teste',
            createdAt: '',
          },
        ],
      },
    )
    assert.ok(erros.some((e) => e.includes('bloqueado')))
  })

  it('aceita registro válido dentro do limite', () => {
    const erros = validatePontoBusinessRules(
      {
        data: '2024-06-10',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:15',
        totalMinutos: 360,
        justificativaHoraExtra: null,
      },
      ctx,
    )
    assert.equal(erros.length, 0)
  })
})
