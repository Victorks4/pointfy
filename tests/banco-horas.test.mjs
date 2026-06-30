import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularBancoHoras } from '../lib/banco-horas.ts'

const user = {
  id: 'u1',
  email: 'e@test.com',
  matricula: 'MAT001',
  nome: 'Est',
  cargo: 'estagiario',
  departamento: 'INFORMATICA',
  cargaHorariaSemanal: 1800,
  dataInicioContrato: null,
  dataFimContrato: null,
  dataInicioRecesso1: null,
  dataFimRecesso1: null,
  dataInicioRecesso2: null,
  dataFimRecesso2: null,
  mustChangePassword: false,
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

  it('aplica compensação aprovada no saldo', () => {
    const pontos = [
      {
        id: 'p1',
        userId: 'u1',
        data: '2024-06-10',
        entrada1: '09:00',
        saida1: '15:00',
        entrada2: null,
        saida2: null,
        totalMinutos: 360,
        observacao: null,
        justificativaHoraExtra: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const justificativas = [
      {
        id: 'j1',
        userId: 'u1',
        data: '2024-06-11',
        tipo: 'compensacao',
        descricao: 'folga',
        arquivoUrl: null,
        minutosAbatidos: -360,
        statusCompensacao: 'aprovada_gestor',
        createdAt: '',
      },
    ]
    const saldo = calcularBancoHoras(user, pontos, justificativas, [])
    assert.equal(saldo, -360)
  })

  it('saldo positivo quando trabalhou acima da carga diária', () => {
    const pontos = [
      {
        id: 'p1',
        userId: 'u1',
        data: '2024-06-10',
        entrada1: '08:00',
        saida1: '12:00',
        entrada2: '13:00',
        saida2: '18:00',
        totalMinutos: 420,
        observacao: null,
        justificativaHoraExtra: 'projeto',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const saldo = calcularBancoHoras(user, pontos, [], [])
    assert.equal(saldo, 60)
  })
})
