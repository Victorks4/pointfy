'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  fetchDashboardBootstrap,
  fetchPontos,
  fetchJustificativas,
} from '@/lib/data-api'
import { isPresencaBloqueada as checkPresencaBloqueada } from '@/lib/presenca-bloqueio'
import {
  compensacaoAfetaSaldo,
  minutosCompensacaoEfetivos,
} from '@/lib/compensacao-utils'
import {
  calcularBancoHoras,
  calcularBancoHorasPorPeriodo,
} from '@/lib/banco-horas'
import { createPontoAction, updatePontoAction } from '@/app/actions/pontos'
import {
  createJustificativaAction,
  aprovarCompensacaoAction,
  rejeitarCompensacaoAction,
} from '@/app/actions/justificativas'
import {
  createUsuarioAction,
  updateUsuarioAction,
  deleteUsuarioAction,
  createNotificacaoAction,
  markNotificacaoReadAction,
  addBloqueioAction,
  removeBloqueioAction,
  addDesafioAction,
  updateDesafioAction,
  deleteDesafioAction,
  upsertDesafioProgressoAction,
  addPontoConfigAction,
  updatePontoConfigAction,
  deletePontoConfigAction,
} from '@/app/actions/admin'
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
import type { ActionResult } from '@/lib/types/action-result'

interface DataContextType {
  isDataLoading: boolean
  isPontosLoading: boolean
  isJustificativasLoading: boolean
  dataError: string | null
  refreshData: () => Promise<void>
  refreshPontos: () => Promise<void>
  refreshJustificativas: () => Promise<void>

  pontos: PontoRegistro[]
  addPonto: (
    ponto: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<ActionResult<PontoRegistro>>
  updatePonto: (id: string, ponto: Partial<PontoRegistro>) => Promise<ActionResult<PontoRegistro>>
  getPontosByUser: (userId: string) => PontoRegistro[]
  getPontoByDate: (userId: string, data: string) => PontoRegistro | undefined

  justificativas: Justificativa[]
  addJustificativa: (
    justificativa: Omit<Justificativa, 'id' | 'createdAt'>,
  ) => Promise<ActionResult<Justificativa>>
  getJustificativasByUser: (userId: string) => Justificativa[]
  getJustificativasVisiveisRh: () => Justificativa[]
  aprovarCompensacao: (gestorId: string, justificativaId: string) => Promise<ActionResult<void>>
  rejeitarCompensacao: (
    gestorId: string,
    justificativaId: string,
    motivoRejeicao?: string,
  ) => Promise<ActionResult<void>>
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
  addUsuario: (usuario: Omit<User, 'id' | 'createdAt'> & { senha?: string }) => void
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
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isPontosLoading, setIsPontosLoading] = useState(false)
  const [isJustificativasLoading, setIsJustificativasLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [pontos, setPontos] = useState<PontoRegistro[]>([])
  const [justificativas, setJustificativas] = useState<Justificativa[]>([])
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [desafios, setDesafios] = useState<DesafioSemanal[]>([])
  const [desafioProgressos, setDesafioProgressos] = useState<DesafioProgresso[]>([])
  const [pontoConfigs, setPontoConfigs] = useState<PontoConfig[]>([DEFAULT_PONTO_CONFIG])
  const [bloqueiosPresenca, setBloqueiosPresenca] = useState<BloqueioPresenca[]>([])

  const applyBootstrap = useCallback(
    (data: Awaited<ReturnType<typeof fetchDashboardBootstrap>>) => {
      setNotificacoes(data.notificacoes)
      setUsuarios(data.usuarios)
      setDesafios(data.desafios)
      setDesafioProgressos(data.desafioProgressos)
      setPontoConfigs(data.pontoConfigs.length ? data.pontoConfigs : [DEFAULT_PONTO_CONFIG])
      setBloqueiosPresenca(data.bloqueiosPresenca)
    },
    [],
  )

  const refreshPontos = useCallback(async () => {
    if (!authUser) return
    setIsPontosLoading(true)
    try {
      setPontos(await fetchPontos())
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Erro ao carregar pontos')
    } finally {
      setIsPontosLoading(false)
    }
  }, [authUser])

  const refreshJustificativas = useCallback(async () => {
    if (!authUser) return
    setIsJustificativasLoading(true)
    try {
      setJustificativas(await fetchJustificativas())
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Erro ao carregar justificativas')
    } finally {
      setIsJustificativasLoading(false)
    }
  }, [authUser])

  const refreshData = useCallback(async () => {
    if (!authUser) return
    setIsDataLoading(true)
    setDataError(null)
    try {
      const bootstrap = await fetchDashboardBootstrap()
      applyBootstrap(bootstrap)
      setIsDataLoading(false)
      const [pontosData, justificativasData] = await Promise.all([
        fetchPontos(),
        fetchJustificativas(),
      ])
      setPontos(pontosData)
      setJustificativas(justificativasData)
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setIsDataLoading(false)
      setIsPontosLoading(false)
      setIsJustificativasLoading(false)
    }
  }, [authUser, applyBootstrap])

  useEffect(() => {
    if (authLoading) return
    if (!authUser) {
      setPontos([])
      setJustificativas([])
      setNotificacoes([])
      setUsuarios([])
      setDesafios([])
      setDesafioProgressos([])
      setBloqueiosPresenca([])
      setIsDataLoading(false)
      return
    }
    refreshData()
  }, [authUser, authLoading, refreshData])

  const addPonto = useCallback(
    async (ponto: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createPontoAction({
        data: ponto.data,
        entrada1: ponto.entrada1,
        saida1: ponto.saida1,
        entrada2: ponto.entrada2,
        saida2: ponto.saida2,
        totalMinutos: ponto.totalMinutos,
        observacao: ponto.observacao,
        justificativaHoraExtra: ponto.justificativaHoraExtra,
      })
      if (result.success) await refreshData()
      return result
    },
    [refreshData],
  )

  const updatePonto = useCallback(
    async (id: string, pontoUpdate: Partial<PontoRegistro>) => {
      const result = await updatePontoAction(id, {
        entrada1: pontoUpdate.entrada1,
        saida1: pontoUpdate.saida1,
        entrada2: pontoUpdate.entrada2,
        saida2: pontoUpdate.saida2,
        totalMinutos: pontoUpdate.totalMinutos,
        observacao: pontoUpdate.observacao,
        justificativaHoraExtra: pontoUpdate.justificativaHoraExtra,
      })
      if (result.success) await refreshData()
      return result
    },
    [refreshData],
  )

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

  const addBloqueioPresenca = useCallback(
    (bloqueio: Omit<BloqueioPresenca, 'id' | 'createdAt'>) => {
      void addBloqueioAction({
        userId: bloqueio.userId,
        dataInicio: bloqueio.dataInicio,
        dataFim: bloqueio.dataFim,
        motivo: bloqueio.motivo,
      }).then(() => refreshData())
    },
    [refreshData],
  )

  const removeBloqueioPresenca = useCallback(
    (id: string) => {
      void removeBloqueioAction(id).then(() => refreshData())
    },
    [refreshData],
  )

  const addJustificativa = useCallback(
    async (justificativa: Omit<Justificativa, 'id' | 'createdAt'>) => {
      const result = await createJustificativaAction({
        data: justificativa.data,
        tipo: justificativa.tipo,
        descricao: justificativa.descricao,
        arquivoPath: justificativa.arquivoUrl,
      })
      if (result.success) await refreshData()
      return result
    },
    [refreshData],
  )

  const aprovarCompensacao = useCallback(
    async (_gestorId: string, justificativaId: string): Promise<ActionResult<void>> => {
      const result = await aprovarCompensacaoAction(justificativaId)
      if (result.success) await refreshData()
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    },
    [refreshData],
  )

  const rejeitarCompensacao = useCallback(
    async (
      _gestorId: string,
      justificativaId: string,
      motivoRejeicao?: string,
    ): Promise<ActionResult<void>> => {
      const result = await rejeitarCompensacaoAction(justificativaId, motivoRejeicao)
      if (result.success) await refreshData()
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    },
    [refreshData],
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

  const addNotificacao = useCallback(
    (notificacao: Omit<Notificacao, 'id' | 'createdAt'>) => {
      void createNotificacaoAction({
        userId: notificacao.userId,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
      }).then(() => refreshData())
    },
    [refreshData],
  )

  const markNotificacaoAsRead = useCallback(
    (id: string) => {
      if (!authUser) return
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
      void markNotificacaoReadAction(id, authUser.id).then(() => refreshData())
    },
    [authUser, refreshData],
  )

  const getNotificacoesByUser = useCallback(
    (userId: string) => notificacoes.filter((n) => n.userId === null || n.userId === userId),
    [notificacoes],
  )

  const addUsuario = useCallback(
    (usuario: Omit<User, 'id' | 'createdAt'> & { senha?: string }) => {
      void createUsuarioAction({
        email: usuario.email,
        senha: usuario.senha ?? 'changeme123',
        ra: usuario.ra,
        nome: usuario.nome,
        cargo: usuario.cargo,
        departamento: usuario.departamento,
        cargaHorariaSemanal: usuario.cargaHorariaSemanal,
        dataInicioRecesso: usuario.dataInicioRecesso,
        dataFimRecesso: usuario.dataFimRecesso,
        gestorId: usuario.gestorId,
      }).then(() => refreshData())
    },
    [refreshData],
  )

  const updateUsuario = useCallback(
    (id: string, usuarioUpdate: Partial<User>) => {
      void updateUsuarioAction(id, usuarioUpdate).then(() => refreshData())
    },
    [refreshData],
  )

  const deleteUsuario = useCallback(
    (id: string) => {
      void deleteUsuarioAction(id).then(() => refreshData())
    },
    [refreshData],
  )

  const getEstagiariosDoGestor = useCallback(
    (gestorId: string) =>
      usuarios.filter((u) => u.cargo === 'estagiario' && u.gestorId === gestorId),
    [usuarios],
  )

  const calcularBancoHorasFn = useCallback(
    (userId: string): number => {
      const u = usuarios.find((x) => x.id === userId)
      if (!u) return 0
      return calcularBancoHoras(u, pontos, justificativas, bloqueiosPresenca)
    },
    [usuarios, pontos, justificativas, bloqueiosPresenca],
  )

  const calcularBancoHorasPorPeriodoFn = useCallback(
    (userId: string, year: string, month: string): number => {
      const u = usuarios.find((x) => x.id === userId)
      if (!u) return 0
      return calcularBancoHorasPorPeriodo(u, pontos, justificativas, bloqueiosPresenca, year, month)
    },
    [usuarios, pontos, justificativas, bloqueiosPresenca],
  )

  const addDesafio = useCallback(
    (desafio: Omit<DesafioSemanal, 'id' | 'createdAt'>) => {
      void addDesafioAction(desafio).then(() => refreshData())
    },
    [refreshData],
  )

  const updateDesafio = useCallback(
    (id: string, update: Partial<DesafioSemanal>) => {
      void updateDesafioAction(id, update).then(() => refreshData())
    },
    [refreshData],
  )

  const deleteDesafio = useCallback(
    (id: string) => {
      void deleteDesafioAction(id).then(() => refreshData())
    },
    [refreshData],
  )

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
      void upsertDesafioProgressoAction(userId, desafioId, progressoAtual, concluido).then(() =>
        refreshData(),
      )
    },
    [refreshData],
  )

  const addPontoConfig = useCallback(
    (config: Omit<PontoConfig, 'id' | 'createdAt'>) => {
      void addPontoConfigAction(config).then(() => refreshData())
    },
    [refreshData],
  )

  const updatePontoConfig = useCallback(
    (id: string, update: Partial<PontoConfig>) => {
      void updatePontoConfigAction(id, update).then(() => refreshData())
    },
    [refreshData],
  )

  const deletePontoConfig = useCallback(
    (id: string) => {
      void deletePontoConfigAction(id).then(() => refreshData())
    },
    [refreshData],
  )

  const getActivePontoConfig = useCallback((): PontoConfig => {
    return pontoConfigs.find((c) => c.ativo) ?? pontoConfigs.find((c) => c.padrao) ?? DEFAULT_PONTO_CONFIG
  }, [pontoConfigs])

  const contextValue = useMemo(
    () =>
      ({
        isDataLoading,
        isPontosLoading,
        isJustificativasLoading,
        dataError,
        refreshData,
        refreshPontos,
        refreshJustificativas,
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
        getBancoHoras: calcularBancoHorasFn,
        calcularBancoHoras: calcularBancoHorasFn,
        getBancoHorasPorPeriodo: calcularBancoHorasPorPeriodoFn,
        calcularBancoHorasPorPeriodo: calcularBancoHorasPorPeriodoFn,
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
      isDataLoading,
      isPontosLoading,
      isJustificativasLoading,
      dataError,
      refreshData,
      refreshPontos,
      refreshJustificativas,
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
      calcularBancoHorasFn,
      calcularBancoHorasPorPeriodoFn,
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
