'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { PontoRegistro, Justificativa, Notificacao, User, BancoHoras } from './types'
import { MINUTOS_COMPENSACAO } from './types'

interface DataContextType {
  // Pontos
  pontos: PontoRegistro[]
  addPonto: (ponto: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePonto: (id: string, ponto: Partial<PontoRegistro>) => void
  getPontosByUser: (userId: string) => PontoRegistro[]
  getPontoByDate: (userId: string, data: string) => PontoRegistro | undefined
  
  // Justificativas
  justificativas: Justificativa[]
  addJustificativa: (justificativa: Omit<Justificativa, 'id' | 'createdAt'>) => void
  getJustificativasByUser: (userId: string) => Justificativa[]
  
  // Notificações
  notificacoes: Notificacao[]
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'createdAt'>) => void
  markNotificacaoAsRead: (id: string) => void
  getNotificacoesByUser: (userId: string) => Notificacao[]
  
  // Usuários (para admin)
  usuarios: User[]
  addUsuario: (usuario: Omit<User, 'id' | 'createdAt'>) => void
  updateUsuario: (id: string, usuario: Partial<User>) => void
  deleteUsuario: (id: string) => void
  
  // Banco de Horas
  getBancoHoras: (userId: string) => number
  calcularBancoHoras: (userId: string) => number
}

const DataContext = createContext<DataContextType | null>(null)

// Dados mock iniciais
const MOCK_USUARIOS: User[] = [
  {
    id: '1',
    email: 'admin@empresa.com',
    ra: 'ADM001',
    nome: 'Administrador',
    cargo: 'admin',
    departamento: 'RH',
    cargaHorariaSemanal: 2400,
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'estagiario@empresa.com',
    ra: 'EST001',
    nome: 'João Silva',
    cargo: 'estagiario',
    departamento: 'TI',
    cargaHorariaSemanal: 1800,
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString()
  }
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [pontos, setPontos] = useState<PontoRegistro[]>([])
  const [justificativas, setJustificativas] = useState<Justificativa[]>([])
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id: '1',
      userId: null,
      titulo: 'Bem-vindo ao Sistema de Ponto',
      mensagem: 'Lembre-se de registrar seu ponto diariamente. Horários devem ser informados no formato HH:mm (ex: 08:15).',
      lida: false,
      createdAt: new Date().toISOString()
    }
  ])
  const [usuarios, setUsuarios] = useState<User[]>(MOCK_USUARIOS)

  // Funções de Ponto
  const addPonto = (ponto: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPonto: PontoRegistro = {
      ...ponto,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setPontos(prev => [...prev, newPonto])
  }

  const updatePonto = (id: string, pontoUpdate: Partial<PontoRegistro>) => {
    setPontos(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...pontoUpdate, updatedAt: new Date().toISOString() }
        : p
    ))
  }

  const getPontosByUser = (userId: string) => {
    return pontos.filter(p => p.userId === userId).sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    )
  }

  const getPontoByDate = (userId: string, data: string) => {
    return pontos.find(p => p.userId === userId && p.data === data)
  }

  // Funções de Justificativa
  const addJustificativa = (justificativa: Omit<Justificativa, 'id' | 'createdAt'>) => {
    const newJustificativa: Justificativa = {
      ...justificativa,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setJustificativas(prev => [...prev, newJustificativa])
  }

  const getJustificativasByUser = (userId: string) => {
    return justificativas.filter(j => j.userId === userId).sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    )
  }

  // Funções de Notificação
  const addNotificacao = (notificacao: Omit<Notificacao, 'id' | 'createdAt'>) => {
    const newNotificacao: Notificacao = {
      ...notificacao,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setNotificacoes(prev => [newNotificacao, ...prev])
  }

  const markNotificacaoAsRead = (id: string) => {
    setNotificacoes(prev => prev.map(n => 
      n.id === id ? { ...n, lida: true } : n
    ))
  }

  const getNotificacoesByUser = (userId: string) => {
    return notificacoes.filter(n => n.userId === null || n.userId === userId)
  }

  // Funções de Usuário
  const addUsuario = (usuario: Omit<User, 'id' | 'createdAt'>) => {
    const newUsuario: User = {
      ...usuario,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setUsuarios(prev => [...prev, newUsuario])
  }

  const updateUsuario = (id: string, usuarioUpdate: Partial<User>) => {
    setUsuarios(prev => prev.map(u => 
      u.id === id ? { ...u, ...usuarioUpdate } : u
    ))
  }

  const deleteUsuario = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setPontos(prev => prev.filter(p => p.userId !== id))
    setJustificativas(prev => prev.filter(j => j.userId !== id))
    setNotificacoes(prev => prev.filter(n => n.userId !== id))
  }

  // Funções de Banco de Horas
  const calcularBancoHoras = (userId: string): number => {
    const user = usuarios.find(u => u.id === userId)
    if (!user) return 0

    const userPontos = getPontosByUser(userId)
    const userJustificativas = getJustificativasByUser(userId)

    // Calcular total de minutos trabalhados
    const totalTrabalhado = userPontos.reduce((acc, p) => acc + p.totalMinutos, 0)

    // Calcular total de minutos compensados (RETIRA do saldo negativo)
    const totalCompensado = userJustificativas
      .filter(j => j.tipo === 'compensacao')
      .reduce((acc, j) => acc + j.minutosAbatidos, 0)

    // Calcular carga horária esperada (baseado nos dias com ponto)
    const diasTrabalhados = userPontos.length
    const cargaDiaria = user.cargaHorariaSemanal / 5 // Assumindo 5 dias por semana
    const cargaEsperada = diasTrabalhados * cargaDiaria

    // Saldo = trabalhado - esperado + compensado
    // Se saldo é negativo e usuário compensa, o totalCompensado reduz a dívida
    return totalTrabalhado - cargaEsperada + totalCompensado
  }

  const getBancoHoras = (userId: string): number => {
    return calcularBancoHoras(userId)
  }

  return (
    <DataContext.Provider value={{
      pontos,
      addPonto,
      updatePonto,
      getPontosByUser,
      getPontoByDate,
      justificativas,
      addJustificativa,
      getJustificativasByUser,
      notificacoes,
      addNotificacao,
      markNotificacaoAsRead,
      getNotificacoesByUser,
      usuarios,
      addUsuario,
      updateUsuario,
      deleteUsuario,
      getBancoHoras,
      calcularBancoHoras
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
