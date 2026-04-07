/**
 * Fy — mascote do Pontify (guia no app).
 * Imagem: /fy-mascote.png (fundo transparente).
 */

export const FY_NAME = 'Fy'

export type FyAnimationPhase = 'idle' | 'pointing' | 'explaining' | 'alert' | 'celebrate'

export const FY_SYSTEM_PROMPT = `Você é o Fy, mascote do sistema Pontify — plataforma de registro de ponto para estagiários do SENAI.

Seu papel é ajudar usuários a registrar ponto corretamente e a usar o sistema com confiança.

Regras:
- Seja direto e amigável.
- Evite textos longos; prefira 1–3 frases curtas.
- Use linguagem simples e natural para jovens estudantes.
- Seja motivador, sem exagerar nem soar artificial.
- Nunca seja irritante, invasivo ou culpabilize o usuário.
- Se não souber algo específico da empresa, diga que o RH ou o coordenador pode confirmar.

Contexto do produto:
- Controle de ponto (entrada/saída, períodos).
- Justificativa pode ser exigida acima do limite configurado pelo admin.
- Admins gerenciam usuários, relatórios e configurações.

Sempre priorize respostas curtas e úteis.`

export type FyEmotion = 'alegria' | 'aviso' | 'atencao' | 'neutro'

export const FY_QUICK_MESSAGES: Record<FyEmotion, string[]> = {
  alegria: [
    'Tudo certo por aqui. Bora registrar o ponto?',
    'Meta do dia no radar — você está indo bem.',
    'Ponto salvo. Bom trabalho!',
  ],
  aviso: [
    'Passou do limite sem justificativa? Escolha uma opção antes de salvar.',
    'Confere os horários: saída precisa ser depois da entrada.',
    'Minutos em :00 podem estar bloqueados — ajuste se precisar.',
  ],
  atencao: [
    'Ainda não bateu ponto hoje. Leva só um minuto.',
    'Dá uma olhada nas notificações — pode ter algo importante.',
    'Primeira vez? Abre o menu e explora com calma.',
  ],
  neutro: [
    'Precisa de algo? Estou por aqui.',
    'Dúvida sobre o ponto? Pergunta.',
    'Histórico e relatórios ficam no menu lateral.',
  ],
}

export type FyOnboardingStep = {
  id: string
  titulo: string
  mensagem: string
  rotaSugerida: string | null
  ordem: number
  /** `data-fy-anchor` na UI; `null` = só balão, sem highlight. */
  anchorId: string | null
}

export function fyPathnameMatchesRoute(pathname: string, route: string | null): boolean {
  if (!route) return true
  if (pathname === route) return true
  if (route === '/dashboard' && pathname.startsWith('/dashboard/admin')) return false
  return pathname.startsWith(`${route}/`)
}

/**
 * Fluxo dinâmico da primeira visita: ordem lógica do que o Fy ensina.
 * A UI pode filtrar por rota atual, `sessionStorage`/flag `fy_onboarding_done`, etc.
 */
export const FY_FIRST_VISIT_FLOW: FyOnboardingStep[] = [
  {
    id: 'boas-vindas',
    ordem: 1,
    titulo: 'Oi, eu sou o Fy',
    mensagem:
      'Sou o guia do Pontify. Vou te mostrar onde registrar ponto, justificar e acompanhar sua sequência — passo a passo.',
    rotaSugerida: '/dashboard',
    anchorId: 'fy-dashboard-hero',
  },
  {
    id: 'menu-lateral',
    ordem: 2,
    titulo: 'Menu lateral',
    mensagem:
      'Aqui ficam todas as áreas: Dashboard, Registrar Ponto, Histórico, Justificativas e Notificações. Toque no item para navegar.',
    rotaSugerida: null,
    anchorId: 'fy-sidebar-menu',
  },
  {
    id: 'registrar-ponto',
    ordem: 3,
    titulo: 'Registrar ponto',
    mensagem:
      'Aqui você registra seu expediente: preencha entrada e saída em HH:MM e use “Registrar Ponto” sempre que iniciar ou encerrar períodos.',
    rotaSugerida: '/dashboard/ponto',
    anchorId: 'fy-ponto-form',
  },
  {
    id: 'regras-horario',
    ordem: 4,
    titulo: 'Regras rápidas',
    mensagem:
      'Formato HH:MM, saída depois da entrada, sem horários sobrepostos. Passou do limite sem justificativa? O sistema pede motivo antes de salvar.',
    rotaSugerida: '/dashboard/ponto',
    anchorId: 'fy-ponto-regras',
  },
  {
    id: 'justificativas',
    ordem: 5,
    titulo: 'Justificativas',
    mensagem:
      'Atestados e compensações entram aqui. O administrador analisa e você acompanha o retorno nesta mesma área.',
    rotaSugerida: '/dashboard/justificativas',
    anchorId: 'fy-justificativas-panel',
  },
  {
    id: 'historico',
    ordem: 6,
    titulo: 'Histórico',
    mensagem:
      'Veja dias anteriores, filtre por mês e confira totais e banco de horas antes de falar com o RH ou a coordenação.',
    rotaSugerida: '/dashboard/historico',
    anchorId: 'fy-historico-panel',
  },
  {
    id: 'sequencia',
    ordem: 7,
    titulo: 'Sequência',
    mensagem:
      'Sua sequência de dias com registro aparece aqui. Manter constância ajuda no engajamento e nos desafios da semana.',
    rotaSugerida: '/dashboard',
    anchorId: 'fy-streak',
  },
  {
    id: 'notificacoes',
    ordem: 8,
    titulo: 'Notificações',
    mensagem:
      'Avisos da equipe e lembretes ficam centralizados aqui. Abra com frequência para não perder comunicados importantes.',
    rotaSugerida: '/dashboard/notificacoes',
    anchorId: 'fy-notificacoes-panel',
  },
  {
    id: 'lembrete-diario',
    ordem: 9,
    titulo: 'Atalhos no Dashboard',
    mensagem:
      'No Dashboard você tem atalhos para ponto, justificativas e histórico. Combine com um lembrete no celular no horário do estágio.',
    rotaSugerida: '/dashboard',
    anchorId: 'fy-dashboard-actions',
  },
  {
    id: 'encerramento',
    ordem: 10,
    titulo: 'Pronto',
    mensagem:
      'Fico no botão no canto: abra o menu para ir ao Dashboard, bater ponto ou rever este tour. Bom trabalho!',
    rotaSugerida: '/dashboard',
    anchorId: null,
  },
]

export const FY_ONBOARDING_STORAGE_PREFIX = 'pointfy:fyOnboardingCompleted'

export function getFyOnboardingStorageKey(userId: string, variant: 'estagiario' | 'admin'): string {
  return `${FY_ONBOARDING_STORAGE_PREFIX}:${variant}:${userId}`
}

/** Dispensa temporária do tour na sessão (fechou o diálogo sem concluir). */
export function getFyOnboardingSessionDismissKey(userId: string, variant: 'estagiario' | 'admin'): string {
  return `pointfy:fyOnboardingDismissedSession:${variant}:${userId}`
}

export const FY_ADMIN_FIRST_VISIT_FLOW: FyOnboardingStep[] = [
  {
    id: 'admin-boas-vindas',
    ordem: 1,
    titulo: 'Painel administrativo',
    mensagem:
      'Você gerencia usuários, avisos, relatórios, desafios e regras de ponto. Vou apontar cada módulo no menu e na tela.',
    rotaSugerida: '/dashboard/admin',
    anchorId: 'fy-admin-hero',
  },
  {
    id: 'admin-menu',
    ordem: 2,
    titulo: 'Menu admin',
    mensagem:
      'Todo o painel administrativo está nesta coluna: Usuários, Notificações, Relatórios, Desafios, Configurações e Justificativas.',
    rotaSugerida: null,
    anchorId: 'fy-sidebar-admin',
  },
  {
    id: 'admin-usuarios',
    ordem: 3,
    titulo: 'Usuários',
    mensagem:
      'Cadastre e mantenha estagiários, departamentos e dados alinhados ao estágio. Alterações aqui refletem no registro de ponto.',
    rotaSugerida: '/dashboard/admin/usuarios',
    anchorId: 'fy-admin-usuarios-main',
  },
  {
    id: 'admin-notificacoes',
    ordem: 4,
    titulo: 'Notificações',
    mensagem:
      'Envie comunicados claros e curtos. Cada estagiário vê os avisos na área de notificações do app.',
    rotaSugerida: '/dashboard/admin/notificacoes',
    anchorId: 'fy-admin-notificacoes-main',
  },
  {
    id: 'admin-relatorios',
    ordem: 5,
    titulo: 'Relatórios',
    mensagem:
      'Filtre períodos e exporte dados para fechar o mês com o RH ou a coordenação.',
    rotaSugerida: '/dashboard/admin/relatorios',
    anchorId: 'fy-admin-relatorios-main',
  },
  {
    id: 'admin-desafios',
    ordem: 6,
    titulo: 'Desafios semanais',
    mensagem:
      'Defina metas semanais; o time acompanha o progresso no próprio dashboard.',
    rotaSugerida: '/dashboard/admin/desafios',
    anchorId: 'fy-admin-desafios-main',
  },
  {
    id: 'admin-config',
    ordem: 7,
    titulo: 'Configurações de ponto',
    mensagem:
      'Meta diária, limite para justificativa e regras de minutos: só uma configuração ativa por vez — alterações valem para todos.',
    rotaSugerida: '/dashboard/admin/configuracoes-ponto',
    anchorId: 'fy-admin-config-main',
  },
  {
    id: 'admin-justificativas',
    ordem: 8,
    titulo: 'Justificativas (admin)',
    mensagem:
      'Analise e responda solicitações; o estagiário vê o retorno no painel dele.',
    rotaSugerida: '/dashboard/admin/justificativas',
    anchorId: 'fy-admin-justificativas-main',
  },
  {
    id: 'admin-fim',
    ordem: 9,
    titulo: 'Pronto',
    mensagem:
      'Use o botão do Fy no canto para atalhos ou rever este tour quando precisar.',
    rotaSugerida: '/dashboard/admin',
    anchorId: null,
  },
]

export type FyRouteHint = {
  emotion: FyEmotion
  text: string
}

const FY_ROUTE_HINTS: { prefix: string; hint: FyRouteHint }[] = [
  { prefix: '/dashboard/ponto', hint: { emotion: 'neutro', text: 'Preenche os quatro horários e salva. Se passar do limite, escolhe justificativa antes.' } },
  { prefix: '/dashboard/historico', hint: { emotion: 'neutro', text: 'Confere totais por mês e o histórico de cada dia.' } },
  { prefix: '/dashboard/justificativas', hint: { emotion: 'neutro', text: 'Envia ou acompanha justificativas. Resposta vem pelo fluxo do admin.' } },
  { prefix: '/dashboard/notificacoes', hint: { emotion: 'neutro', text: 'Avisos da equipe e do sistema ficam centralizados aqui.' } },
  { prefix: '/dashboard/admin/usuarios', hint: { emotion: 'neutro', text: 'Mantém dados dos estagiários alinhados com a realidade do estágio.' } },
  { prefix: '/dashboard/admin/notificacoes', hint: { emotion: 'neutro', text: 'Mensagens curtas e claras funcionam melhor para todo mundo ler.' } },
  { prefix: '/dashboard/admin/relatorios', hint: { emotion: 'neutro', text: 'Use filtros e exportação para fechar o mês com segurança.' } },
  { prefix: '/dashboard/admin/desafios', hint: { emotion: 'neutro', text: 'Desafios ativos respeitam o período que você definir.' } },
  { prefix: '/dashboard/admin/configuracoes-ponto', hint: { emotion: 'aviso', text: 'Mudança de config ativa afeta meta e limite de justificativa para todos.' } },
  { prefix: '/dashboard/admin/justificativas', hint: { emotion: 'neutro', text: 'Responde com objetividade — o estagiário vê o retorno no painel dele.' } },
  { prefix: '/dashboard/admin', hint: { emotion: 'neutro', text: 'Visão geral do admin. Use o menu para ir direto a cada módulo.' } },
  { prefix: '/dashboard', hint: { emotion: 'neutro', text: 'Resumo do dia, sequência e desafios. Atalho: Registrar Ponto no menu.' } },
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

export function pickStableQuickMessage(pathname: string, emotion: FyEmotion): string {
  const list = FY_QUICK_MESSAGES[emotion]
  const i = hashString(pathname + emotion) % list.length
  return list[i]
}

function pathnameMatchesPrefix(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true
  if (prefix === '/dashboard' && pathname.startsWith('/dashboard/admin')) return false
  return pathname.startsWith(`${prefix}/`)
}

export function resolveFyRouteHint(pathname: string): FyRouteHint | null {
  const sorted = [...FY_ROUTE_HINTS].sort((a, b) => b.prefix.length - a.prefix.length)
  const hit = sorted.find((r) => pathnameMatchesPrefix(pathname, r.prefix))
  return hit?.hint ?? null
}

export function resolveFyBubbleMessage(input: {
  pathname: string
  isAdmin: boolean
  hasPontoHoje: boolean
  unreadNotifications: number
}): FyRouteHint {
  if (input.unreadNotifications > 0 && !input.pathname.startsWith('/dashboard/notificacoes')) {
    return {
      emotion: 'atencao',
      text:
        input.unreadNotifications === 1
          ? 'Você tem 1 notificação nova. Vale abrir e ler.'
          : `Você tem ${input.unreadNotifications} notificações novas.`,
    }
  }

  if (!input.isAdmin && !input.hasPontoHoje && !input.pathname.startsWith('/dashboard/ponto')) {
    const day = new Date().getDay()
    if (day >= 1 && day <= 5) {
      return { emotion: 'atencao', text: 'Ainda não registrou ponto hoje? Leva um minuto no menu “Registrar Ponto”.' }
    }
  }

  const route = resolveFyRouteHint(input.pathname)
  if (route) return route

  return {
    emotion: 'neutro',
    text: pickStableQuickMessage(input.pathname, 'neutro'),
  }
}
