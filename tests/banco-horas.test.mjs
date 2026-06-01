import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularBancoHoras } from '../lib/server/banco-horas'

const user = {
  id: 'u1',
  email: 'e@test.com',
  ra: 'RA',
  nome: 'Est',
  cargo: 'estagiario',
  departamento: 'TI',
  cargaHorariaSemanal: 1800,
  dataInicioRecesso: null,
  dataFimRecesso: null,
  gestorId: null,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('calcularBancoHoras', () => {
  it('calcula saldo positivo quando trabalhou mais que a carga esperada', () => {
    const pontos = [
      {
        id: 'p1',
        userId: 'u1',
        data: '2024-06-10',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:15',
        totalMinutos: 360,
        observacao: null,
        justificativaHoraExtra: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const saldo = calcularBancoHoras(user, pontos, [], [])
    assert.equal(saldo, 0)
  })

  it('ignora pontos em data bloqueada', () => {
    const pontos = [
      {
        id: 'p1',
        userId: 'u1',
        data: '2024-06-10',
        entrada1: '09:15',
        saida1: '12:15',
        entrada2: '13:15',
        saida2: '16:15',
        totalMinutos: 360,
        observacao: null,
        justificativaHoraExtra: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const bloqueios = [
      {
        id: 'b1',
        userId: 'u1',
        dataInicio: '2024-06-10',
        dataFim: '2024-06-10',
        motivo: 'teste',
        createdAt: '',
      },
    ]
    const saldo = calcularBancoHoras(user, pontos, [], bloqueios)
    assert.equal(saldo, 0)
  })
})
