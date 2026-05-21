'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cloneDemoUsersForDataState } from '@/lib/demo-users'
import type {
  PontoRegistro,
  Justificativa,
  Notificacao,
  User,
  DesafioSemanal,
  DesafioProgresso,
  PontoConfig,
  BloqueioPresenca,
} from './types'
import { MINUTOS_COMPENSACAO } from './types'
import { isPresencaBloqueada as checkPresencaBloqueada } from '@/lib/presenca-bloqueio'
import {
  compensacaoAfetaSaldo,
  minutosCompensacaoEfetivos,
} from '@/lib/compensacao-utils'

interface DataContextType {
  pontos: PontoRegistro[]
  addPonto: (ponto: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePonto: (id: string, ponto: Partial<PontoRegistro>) => void
  getPontosByUser: (userId: string) => PontoRegistro[]
  getPontoByDate: (userId: string, data: string) => PontoRegistro | undefined

  justificativas: Justificativa[]
  addJustificativa: (justificativa: Omit<Justificativa, 'id' | 'createdAt'>) => void
  getJustificativasByUser: (userId: string) => Justificativa[]
  getJustificativasVisiveisRh: () => Justificativa[]
  aprovarCompensacao: (gestorId: string, justificativaId: string) => { ok: true } | { ok: false; reason: string }
  rejeitarCompensacao: (
    gestorId: string,
    justificativaId: string,
    motivoRejeicao?: string,
  ) => { ok: true } | { ok: false; reason: string }
  getCompensacoesPendentesGestor: (gestorId: string) => Justificativa[]
  getCompensacoesHistoricoGestor: (gestorId: string) => Justificativa[]

  bloqueiosPresenca: BloqueioPresenca[]
  addBloqueioPresenca: (bloqueio: Omit<BloqueioPresenca, 'id' | 'createdAt'>) => void
  removeBloqueioPresenca: (id: string) => void
  isPresencaBloqueada: (userId: string, data: string) => boolean

  notificacoes: Notificacao[]
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'createdAt'>) => void
  markNotificacaoAsRead: (id: string) => void
  getNotificacoesByUser: (userId: string) => Notificacao[]

  usuarios: User[]
  addUsuario: (usuario: Omit<User, 'id' | 'createdAt'>) => void
  updateUsuario: (id: string, usuario: Partial<User>) => void
  deleteUsuario: (id: string) => void
  getEstagiariosDoGestor: (gestorId: string) => User[]

  getBancoHoras: (userId: string) => number
  calcularBancoHoras: (userId: string) => number
  getBancoHorasPorPeriodo: (userId: string, year: string, month: string) => number
  calcularBancoHorasPorPeriodo: (userId: string, year: string, month: string) => number

  desafios: DesafioSemanal[]
  addDesafio: (desafio: Omit<DesafioSemanal, 'id' | 'createdAt'>) => void
  updateDesafio: (id: string, desafio: Partial<DesafioSemanal>) => void
  deleteDesafio: (id: string) => void
  getDesafiosSemanaAtual: () => DesafioSemanal[]

  desafioProgressos: DesafioProgresso[]
  getProgressoDesafio: (userId: string, desafioId: string) => DesafioProgresso | undefined
  atualizarProgressoDesafio: (userId: string, desafioId: string, progressoAtual: number, concluido: boolean) => void

  pontoConfigs: PontoConfig[]
  addPontoConfig: (config: Omit<PontoConfig, 'id' | 'createdAt'>) => void
  updatePontoConfig: (id: string, config: Partial<PontoConfig>) => void
  deletePontoConfig: (id: string) => void
  getActivePontoConfig: () => PontoConfig
}

const DataContext = createContext<DataContextType | null>(null)

const DEFAULT_PONTO_CONFIG: PontoConfig = {
  id: 'default',
  nome: 'Padrão (6h/dia)',
  metaDiariaMinutos: 360,
  limiteMinutosSemJustificativa: 370,
  rejeitarMinutosZero: true,
  formatoDecimal: 'americano',
  horarioEntradaEsperado: '09:00',
  ativo: true,
  padrao: true,
  createdAt: new Date().toISOString(),
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [pontos, setPontos] = useState<PontoRegistro[]>([])
  const [justificativas, setJustificativas] = useState<Justificativa[]>([])
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id: '1',
      userId: null,
      titulo: 'Bem-vindo ao sistema de presença',
      mensagem:
        'Lembre-se de registrar sua presença diariamente. Horários devem ser informados no formato HH:mm (ex: 08:15).',
      lida: false,
      createdAt: new Date().toISOString(),
    },
  ])
  const [usuarios, setUsuarios] = useState<User[]>(() => cloneDemoUsersForDataState())
  const [desafios, setDesafios] = useState<DesafioSemanal[]>([])
  const [desafioProgressos, setDesafioProgressos] = useState<DesafioProgresso[]>([])
  const [pontoConfigs, setPontoConfigs] = useState<PontoConfig[]>([DEFAULT_PONTO_CONFIG])
  const [bloqueiosPresenca, setBloqueiosPresenca] = useState<BloqueioPresenca[]>([])

  const addPonto = useCallback((ponto: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPonto: PontoRegistro = {
      ...ponto,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPontos((prev) => [...prev, newPonto])
  }, [])

  const updatePonto = useCallback((id: string, pontoUpdate: Partial<PontoRegistro>) => {
    setPontos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...pontoUpdate, updatedAt: new Date().toISOString() } : p,
      ),
    )
  }, [])

  const getPontosByUser = useCallback(
    (userId: string) =>
      pontos
        .filter((p) => p.userId === userId)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [pontos],
  )

  const getPontoByDate = useCallback(
    (userId: string, data: string) => pontos.find((p) => p.userId === userId && p.data === data),
    [pontos],
  )

  const isPresencaBloqueadaFn = useCallback(
    (userId: string, data: string) => checkPresencaBloqueada(bloqueiosPresenca, userId, data),
    [bloqueiosPresenca],
  )

  const addBloqueioPresenca = useCallback((bloqueio: Omit<BloqueioPresenca, 'id' | 'createdAt'>) => {
    const row: BloqueioPresenca = {
      ...bloqueio,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setBloqueiosPresenca((prev) => [...prev, row])
  }, [])

  const removeBloqueioPresenca = useCallback((id: string) => {
    setBloqueiosPresenca((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const addJustificativa = useCallback(
    (justificativa: Omit<Justificativa, 'id' | 'createdAt'>) => {
      const est = usuarios.find((u) => u.id === justificativa.userId)
      const base: Justificativa = {
        ...justificativa,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      if (justificativa.tipo === 'compensacao') {
        const newJustificativa: Justificativa = {
          ...base,
          minutosAbatidos: 0,
          statusCompensacao: 'pendente_gestor',
          gestorId: est?.gestorId ?? null,
          decididaEm: null,
          motivoRejeicao: null,
        }
        setJustificativas((prev) => [...prev, newJustificativa])
        if (est?.gestorId) {
          setNotificacoes((prev) => [
            {
              id: `${Date.now()}-comp`,
              userId: est.gestorId!,
              titulo: 'Compensação pendente',
              mensagem: `${est.nome} solicitou compensação para ${justificativa.data}.`,
              lida: false,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ])
        }
        return
      }
      setJustificativas((prev) => [...prev, base])
    },
    [usuarios],
  )

  const aprovarCompensacao = useCallback(
    (gestorId: string, justificativaId: string): { ok: true } | { ok: false; reason: string } => {
      const j = justificativas.find((x) => x.id === justificativaId)
      if (!j || j.tipo !== 'compensacao') return { ok: false, reason: 'nao_encontrada' }
      const est = usuarios.find((u) => u.id === j.userId)
      if (!est || est.gestorId !== gestorId) return { ok: false, reason: 'nao_autorizado' }
      if (j.statusCompensacao !== 'pendente_gestor') return { ok: false, reason: 'ja_decidida' }
      setJustificativas((prev) =>
        prev.map((row) =>
          row.id === justificativaId
            ? {
                ...row,
                statusCompensacao: 'aprovada_gestor',
                minutosAbatidos: -MINUTOS_COMPENSACAO,
                decididaEm: new Date().toISOString(),
              }
            : row,
        ),
      )
      setNotificacoes((prev) => [
        {
          id: `${Date.now()}-cap`,
          userId: j.userId,
          titulo: 'Compensação aprovada',
          mensagem: 'Sua solicitação de compensação foi aprovada pelo gestor.',
          lida: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      return { ok: true }
    },
    [justificativas, usuarios],
  )

  const rejeitarCompensacao = useCallback(
    (
      gestorId: string,
      justificativaId: string,
      motivoRejeicao?: string,
    ): { ok: true } | { ok: false; reason: string } => {
      const j = justificativas.find((x) => x.id === justificativaId)
      if (!j || j.tipo !== 'compensacao') return { ok: false, reason: 'nao_encontrada' }
      const est = usuarios.find((u) => u.id === j.userId)
      if (!est || est.gestorId !== gestorId) return { ok: false, reason: 'nao_autorizado' }
      if (j.statusCompensacao !== 'pendente_gestor') return { ok: false, reason: 'ja_decidida' }
      setJustificativas((prev) =>
        prev.map((row) =>
          row.id === justificativaId
            ? {
                ...row,
                statusCompensacao: 'rejeitada_gestor',
                minutosAbatidos: 0,
                decididaEm: new Date().toISOString(),
                motivoRejeicao: motivoRejeicao?.trim() || null,
              }
            : row,
        ),
      )
      setNotificacoes((prev) => [
        {
          id: `${Date.now()}-crej`,
          userId: j.userId,
          titulo: 'Compensação não aprovada',
          mensagem: motivoRejeicao?.trim()
            ? `Sua compensação foi rejeitada: ${motivoRejeicao.trim()}`
            : 'Sua solicitação de compensação foi rejeitada pelo gestor.',
          lida: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      return { ok: true }
    },
    [justificativas, usuarios],
  )

  const getCompensacoesPendentesGestor = useCallback(
    (gestorId: string) => {
      const ids = usuarios
        .filter((u) => u.cargo === 'estagiario' && u.gestorId === gestorId)
        .map((u) => u.id)
      return justificativas.filter(
        (j) =>
          j.tipo === 'compensacao' &&
          j.statusCompensacao === 'pendente_gestor' &&
          ids.includes(j.userId),
      )
    },
    [justificativas, usuarios],
  )

  const getCompensacoesHistoricoGestor = useCallback(
    (gestorId: string) => {
      const ids = usuarios
        .filter((u) => u.cargo === 'estagiario' && u.gestorId === gestorId)
        .map((u) => u.id)
      return justificativas
        .filter((j) => j.tipo === 'compensacao' && ids.includes(j.userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    [justificativas, usuarios],
  )

  const getJustificativasVisiveisRh = useCallback(
    () =>
      justificativas.filter(
        (j) =>
          j.tipo === 'atestado' ||
          (j.tipo === 'compensacao' && compensacaoAfetaSaldo(j)),
      ),
    [justificativas],
  )

  const getJustificativasByUser = useCallback(
    (userId: string) =>
      justificativas
        .filter((j) => j.userId === userId)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [justificativas],
  )

  const addNotificacao = useCallback((notificacao: Omit<Notificacao, 'id' | 'createdAt'>) => {
    const newNotificacao: Notificacao = {
      ...notificacao,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setNotificacoes((prev) => [newNotificacao, ...prev])
  }, [])

  const markNotificacaoAsRead = useCallback((id: string) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
  }, [])

  const getNotificacoesByUser = useCallback(
    (userId: string) => notificacoes.filter((n) => n.userId === null || n.userId === userId),
    [notificacoes],
  )

  const addUsuario = useCallback((usuario: Omit<User, 'id' | 'createdAt'>) => {
    const newUsuario: User = {
      ...usuario,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setUsuarios((prev) => [...prev, newUsuario])
  }, [])

  const updateUsuario = useCallback((id: string, usuarioUpdate: Partial<User>) => {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...usuarioUpdate } : u)))
  }, [])

  const deleteUsuario = useCallback((id: string) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id))
    setPontos((prev) => prev.filter((p) => p.userId !== id))
    setJustificativas((prev) => prev.filter((j) => j.userId !== id))
    setNotificacoes((prev) => prev.filter((n) => n.userId !== id))
  }, [])

  const getEstagiariosDoGestor = useCallback(
    (gestorId: string) =>
      usuarios.filter((u) => u.cargo === 'estagiario' && u.gestorId === gestorId),
    [usuarios],
  )

  const calcularBancoHoras = useCallback(
    (userId: string): number => {
      const user = usuarios.find((u) => u.id === userId)
      if (!user) return 0

      const userPontos = pontos.filter(
        (p) => p.userId === userId && !checkPresencaBloqueada(bloqueiosPresenca, userId, p.data),
      )
      const userJustificativas = justificativas.filter((j) => j.userId === userId)

      const totalTrabalhado = userPontos.reduce((acc, p) => acc + p.totalMinutos, 0)
      const totalCompensado = userJustificativas
        .filter(
          (j) =>
            compensacaoAfetaSaldo(j) &&
            !checkPresencaBloqueada(bloqueiosPresenca, userId, j.data),
        )
        .reduce((acc, j) => acc + minutosCompensacaoEfetivos(j), 0)

      const diasTrabalhados = userPontos.length
      const cargaDiaria = user.cargaHorariaSemanal / 5
      const cargaEsperada = diasTrabalhados * cargaDiaria

      return totalTrabalhado - cargaEsperada + totalCompensado
    },
    [usuarios, pontos, justificativas, bloqueiosPresenca],
  )

  const calcularBancoHorasPorPeriodo = useCallback(
    (userId: string, year: string, month: string): number => {
      const user = usuarios.find((u) => u.id === userId)
      if (!user) return 0

      const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`
      const getYearMonthFromDate = (dateString: string) => dateString.slice(0, 7)

      const pontosNoPeriodo = pontos.filter(
        (p) =>
          p.userId === userId &&
          getYearMonthFromDate(p.data) === yearMonthKey &&
          !checkPresencaBloqueada(bloqueiosPresenca, userId, p.data),
      )
      const justificativasNoPeriodo = justificativas.filter(
        (j) =>
          j.userId === userId &&
          getYearMonthFromDate(j.data) === yearMonthKey &&
          !checkPresencaBloqueada(bloqueiosPresenca, userId, j.data),
      )

      const totalTrabalhado = pontosNoPeriodo.reduce((acc, p) => acc + p.totalMinutos, 0)
      const totalCompensado = justificativasNoPeriodo
        .filter((j) => compensacaoAfetaSaldo(j))
        .reduce((acc, j) => acc + minutosCompensacaoEfetivos(j), 0)

      const diasTrabalhados = pontosNoPeriodo.length
      const cargaDiaria = user.cargaHorariaSemanal / 5
      const cargaEsperada = diasTrabalhados * cargaDiaria

      return totalTrabalhado - cargaEsperada + totalCompensado
    },
    [usuarios, pontos, justificativas, bloqueiosPresenca],
  )

  const getBancoHoras = useCallback(
    (userId: string) => calcularBancoHoras(userId),
    [calcularBancoHoras],
  )

  const getBancoHorasPorPeriodo = useCallback(
    (userId: string, year: string, month: string) =>
      calcularBancoHorasPorPeriodo(userId, year, month),
    [calcularBancoHorasPorPeriodo],
  )

  const addDesafio = useCallback((desafio: Omit<DesafioSemanal, 'id' | 'createdAt'>) => {
    const newDesafio: DesafioSemanal = {
      ...desafio,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setDesafios((prev) => [...prev, newDesafio])
  }, [])

  const updateDesafio = useCallback((id: string, update: Partial<DesafioSemanal>) => {
    setDesafios((prev) => prev.map((d) => (d.id === id ? { ...d, ...update } : d)))
  }, [])

  const deleteDesafio = useCallback((id: string) => {
    setDesafios((prev) => prev.filter((d) => d.id !== id))
    setDesafioProgressos((prev) => prev.filter((dp) => dp.desafioId !== id))
  }, [])

  const getDesafiosSemanaAtual = useCallback((): DesafioSemanal[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return desafios.filter((d) => {
      if (!d.ativo) return false
      const inicio = new Date(`${d.dataInicio}T00:00:00`)
      const fim = new Date(`${d.dataFim}T23:59:59`)
      return today >= inicio && today <= fim
    })
  }, [desafios])

  const getProgressoDesafio = useCallback(
    (userId: string, desafioId: string) =>
      desafioProgressos.find((dp) => dp.userId === userId && dp.desafioId === desafioId),
    [desafioProgressos],
  )

  const atualizarProgressoDesafio = useCallback(
    (userId: string, desafioId: string, progressoAtual: number, concluido: boolean) => {
      setDesafioProgressos((prev) => {
        const existing = prev.find((dp) => dp.userId === userId && dp.desafioId === desafioId)
        if (existing) {
          if (existing.progressoAtual === progressoAtual && existing.concluido === concluido) {
            return prev
          }
          return prev.map((dp) =>
            dp.id === existing.id
              ? {
                  ...dp,
                  progressoAtual,
                  concluido,
                  concluidoEm: concluido ? dp.concluidoEm ?? new Date().toISOString() : null,
                }
              : dp,
          )
        }
        return [
          ...prev,
          {
            id: Date.now().toString(),
            desafioId,
            userId,
            progressoAtual,
            concluido,
            concluidoEm: concluido ? new Date().toISOString() : null,
          },
        ]
      })
    },
    [],
  )

  const addPontoConfig = useCallback((config: Omit<PontoConfig, 'id' | 'createdAt'>) => {
    const newConfig: PontoConfig = {
      ...config,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    if (newConfig.ativo) {
      setPontoConfigs((prev) => prev.map((c) => ({ ...c, ativo: false })).concat(newConfig))
    } else {
      setPontoConfigs((prev) => [...prev, newConfig])
    }
  }, [])

  const updatePontoConfig = useCallback((id: string, update: Partial<PontoConfig>) => {
    setPontoConfigs((prev) => {
      let configs = prev.map((c) => (c.id === id ? { ...c, ...update } : c))
      if (update.ativo === true) {
        configs = configs.map((c) => (c.id === id ? c : { ...c, ativo: false }))
      }
      return configs
    })
  }, [])

  const deletePontoConfig = useCallback((id: string) => {
    setPontoConfigs((prev) => {
      const target = prev.find((c) => c.id === id)
      if (target?.padrao) return prev
      const remaining = prev.filter((c) => c.id !== id)
      if (target?.ativo && remaining.length > 0) {
        const defaultConfig = remaining.find((c) => c.padrao)
        if (defaultConfig) {
          return remaining.map((c) => (c.id === defaultConfig.id ? { ...c, ativo: true } : c))
        }
        return remaining.map((c, i) => (i === 0 ? { ...c, ativo: true } : c))
      }
      return remaining
    })
  }, [])

  const getActivePontoConfig = useCallback((): PontoConfig => {
    return pontoConfigs.find((c) => c.ativo) ?? pontoConfigs.find((c) => c.padrao) ?? DEFAULT_PONTO_CONFIG
  }, [pontoConfigs])

  const contextValue = useMemo(
    () =>
      ({
        pontos,
        addPonto,
        updatePonto,
        getPontosByUser,
        getPontoByDate,
        justificativas,
        addJustificativa,
        getJustificativasByUser,
        getJustificativasVisiveisRh,
        aprovarCompensacao,
        rejeitarCompensacao,
        getCompensacoesPendentesGestor,
        getCompensacoesHistoricoGestor,
        bloqueiosPresenca,
        addBloqueioPresenca,
        removeBloqueioPresenca,
        isPresencaBloqueada: isPresencaBloqueadaFn,
        notificacoes,
        addNotificacao,
        markNotificacaoAsRead,
        getNotificacoesByUser,
        usuarios,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        getEstagiariosDoGestor,
        getBancoHoras,
        calcularBancoHoras,
        getBancoHorasPorPeriodo,
        calcularBancoHorasPorPeriodo,
        desafios,
        addDesafio,
        updateDesafio,
        deleteDesafio,
        getDesafiosSemanaAtual,
        desafioProgressos,
        getProgressoDesafio,
        atualizarProgressoDesafio,
        pontoConfigs,
        addPontoConfig,
        updatePontoConfig,
        deletePontoConfig,
        getActivePontoConfig,
      }) satisfies DataContextType,
    [
      pontos,
      addPonto,
      updatePonto,
      getPontosByUser,
      getPontoByDate,
      justificativas,
      addJustificativa,
      getJustificativasByUser,
      getJustificativasVisiveisRh,
      aprovarCompensacao,
      rejeitarCompensacao,
      getCompensacoesPendentesGestor,
      getCompensacoesHistoricoGestor,
      bloqueiosPresenca,
      addBloqueioPresenca,
      removeBloqueioPresenca,
      isPresencaBloqueadaFn,
      notificacoes,
      addNotificacao,
      markNotificacaoAsRead,
      getNotificacoesByUser,
      usuarios,
      addUsuario,
      updateUsuario,
      deleteUsuario,
      getEstagiariosDoGestor,
      getBancoHoras,
      calcularBancoHoras,
      getBancoHorasPorPeriodo,
      calcularBancoHorasPorPeriodo,
      desafios,
      addDesafio,
      updateDesafio,
      deleteDesafio,
      getDesafiosSemanaAtual,
      desafioProgressos,
      getProgressoDesafio,
      atualizarProgressoDesafio,
      pontoConfigs,
      addPontoConfig,
      updatePontoConfig,
      deletePontoConfig,
      getActivePontoConfig,
    ],
  )

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
