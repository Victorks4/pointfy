/**
 * Fy — mascote do Pontify (guia no app).
 * Imagem: /fy-mascote.png (fundo transparente).
 */

export const FY_NAME = 'Fy'

export type FyAnimationPhase = 'idle' | 'pointing' | 'explaining' | 'alert' | 'celebrate'

/** Mood visual do Fy - controla aparências e reações */
export type FyMood = 'neutro' | 'alegria' | 'aviso' | 'atencao' | 'entediado' | 'dormindo'

/** Reação visual do Fy a eventos */
export type FyReaction = {
  mood: FyMood
  animation: 'idle' | 'celebrate' | 'alert' | 'sleep' | 'wake' | 'bored'
  duration?: number
}

export const FY_SYSTEM_PROMPT = `Você é o Fy, mascote do sistema Pontify — plataforma de registro de ponto para estagiários do SENAI.

Seu papel é ajudar usuários a registrar presença corretamente e a usar o sistema com confiança.

Regras:
- Seja direto e amigável.
- Evite textos longos; prefira 1–3 frases curtas.
- Use linguagem simples e natural para jovens estagiários.
- Seja motivador, sem exagerar nem soar artificial.
- Nunca seja irritante, invasivo ou culpabilize o usuário.
- Se não souber algo específico da empresa, diga que o RH ou o coordenador pode confirmar.

Contexto do produto:
- Registro de presença (entrada/saída, períodos).
- Justificativa pode ser exigida acima do limite configurado pelo admin.
- Estagiários baixam relatório mensal em PDF (padrão SENAI) em Relatórios; após gerar o arquivo, devem assinar no portal de assinatura externo da empresa (não no Pontify).
- Admins gerenciam usuários, configurações e acompanham totais; gestores acompanham estagiários vinculados.

Sempre priorize respostas curtas e úteis.`

export type FyEmotion = 'alegria' | 'aviso' | 'atencao' | 'neutro'

export const FY_QUICK_MESSAGES: Record<FyEmotion, string[]> = {
  alegria: [
    'Tudo certo por aqui. Bora registrar a presença?',
    'Meta do dia no radar, você está indo bem!',
    'Presença salva. Bom trabalho!',
  ],
  aviso: [
    'Passou do limite sem justificativa? Escolha uma opção antes de salvar.',
    'Confere os horários: saída precisa ser depois da entrada.',
    'Minutos em :00 podem estar bloqueados, ajuste se precisar.',
  ],
  atencao: [
    'Ainda não registrou presença hoje. Leva só um minuto.',
    'Dá uma olhada nas notificações, pode ter algo importante.',
    'Primeira vez? Abre o menu e explora com calma.',
  ],
  neutro: [
    'Precisa de algo? Estou por aqui.',
    'Dúvida sobre presença ou relatório? Pergunta nas FAQ.',
    'Relatório mensal em PDF: menu Relatórios; depois assine no portal da empresa.',
  ],
}

/** Dicas no dock do Fy para estagiários: produtividade, pontuação e hábitos. */
export const FY_DOCK_TIPS_ESTAGIARIO: string[] = [
  'Sua pontuação no dashboard mistura consistência (sequência), bater a meta diária e pontualidade — cada parte vale.',
  'Manter dias seguidos com registro sobe sua sequência; isso pesa forte no cálculo de produtividade.',
  'Bater a meta de horas do dia ajuda o score: revise o card de nível e o que falta para o próximo tier.',
  'Chegar e registrar perto do horário combinado melhora a nota de pontualidade — use o relógio do sistema.',
  'Desafios da semana somam com seu ritmo: acompanhe o progresso nos cards do dashboard.',
  'Histórico e saldo mostram o retrato real do mês; confira antes de falar com o RH.',
  'No fim do mês: Relatórios → baixe o PDF SENAI → depois assine no portal de assinatura da empresa.',
  'O PDF traz seus horários e campos para assinatura; a assinatura digital não é feita dentro do Pontify.',
  'Justificativa bem preenchida evita atrito: descreva o contexto com clareza quando precisar.',
  'Pequena rotina vence: abrir o Pontify no mesmo horário do estágio vira hábito em poucas semanas.',
]

/** Dicas no dock do Fy para administradores: gestão, comunicação e regras. */
export const FY_DOCK_TIPS_ADMIN: string[] = [
  'Alinhe mudanças de configuração de ponto com o RH: meta e limite de justificativa valem para todos os estagiários.',
  'Estagiários geram o PDF mensal em Relatórios (menu deles) e assinam no portal externo; você acompanha totais no painel e histórico.',
  'Notificações curtas e objetivas têm mais leitura; use para avisos que realmente precisam de ação.',
  'Na fila de justificativas, respostas claras reduzem ida e volta, o estagiário vê o retorno no painel dele.',
  'Usuários com departamento e carga horária corretos evitam erro no fechamento de horas.',
  'Desafios semanais funcionam melhor com meta realista e prazo visível para o time acompanhar.',
  'Antes de publicar uma nova regra, revise quem está em recesso ou período especial nos cadastros.',
  'Painel geral + drill-down por estagiário no histórico/admin ajuda a priorizar quem precisa de suporte.',
]

export const FY_DOCK_TIPS_GESTOR: string[] = [
  'Seu painel reúne só estagiários vinculados a você; o administrador define esse vínculo no cadastro.',
  'Alterne entre Resumo, registros e histórico para ver o dia e o mês sem misturar perfis.',
  'Saldo e sequência ajudam a perceber padrões antes de conversar com o estagiário.',
  'Abra o histórico completo pelo atalho quando precisar do mesmo filtro por mês da tela principal.',
  'Justificativas pendentes ou respondidas aparecem na aba dedicada; combine com as notificações do estagiário.',
  'No fim do mês o estagiário baixa o PDF em Relatórios e assina no portal externo; você confere os dados no painel antes da assinatura.',
]

export type FyTipRole = 'estagiario' | 'admin' | 'gestor'

export function getFyDockRotationTips(role: FyTipRole): readonly string[] {
  if (role === 'admin') return FY_DOCK_TIPS_ADMIN
  if (role === 'gestor') return FY_DOCK_TIPS_GESTOR
  return FY_DOCK_TIPS_ESTAGIARIO
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
  if (route === '/dashboard' && pathname.startsWith('/dashboard/gestor')) return false
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
      'Sou o guia do Pontify. Vou te mostrar presença, justificativas, relatório mensal em PDF e como assinar no portal da empresa, passo a passo.',
    rotaSugerida: '/dashboard',
    anchorId: 'fy-dashboard-hero',
  },
  {
    id: 'menu-lateral',
    ordem: 2,
    titulo: 'Menu lateral',
    mensagem:
      'Aqui ficam todas as áreas: Dashboard, Registrar Presença, Histórico, Justificativas, Relatórios e Notificações. Toque no item para navegar.',
    rotaSugerida: null,
    anchorId: 'fy-sidebar-menu',
  },
  {
    id: 'registrar-ponto',
    ordem: 3,
    titulo: 'Registrar presença',
    mensagem:
      'Aqui você registra seu expediente: preencha entrada e saída em HH:MM e use “Registrar Presença” sempre que iniciar ou encerrar períodos.',
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
      'Veja dias anteriores, filtre por mês e confira totais e saldo antes de falar com o RH ou a coordenação.',
    rotaSugerida: '/dashboard/historico',
    anchorId: 'fy-historico-panel',
  },
  {
    id: 'relatorios',
    ordem: 7,
    titulo: 'Relatórios mensais',
    mensagem:
      'Novidade: em Relatórios você baixa o PDF no padrão SENAI com seus horários do mês. Depois de emitir o arquivo, acesse o portal de assinatura da empresa para assinar, essa etapa é fora do Pontify.',
    rotaSugerida: '/dashboard/relatorios',
    anchorId: 'fy-relatorios-panel',
  },
  {
    id: 'sequencia',
    ordem: 8,
    titulo: 'Sequência',
    mensagem:
      'Sua sequência de dias com registro aparece aqui. Manter constância ajuda no engajamento e nos desafios da semana.',
    rotaSugerida: '/dashboard',
    anchorId: 'fy-streak',
  },
  {
    id: 'notificacoes',
    ordem: 9,
    titulo: 'Notificações',
    mensagem:
      'Avisos da equipe e lembretes ficam centralizados aqui. Abra com frequência para não perder comunicados importantes.',
    rotaSugerida: '/dashboard/notificacoes',
    anchorId: 'fy-notificacoes-panel',
  },
  {
    id: 'lembrete-diario',
    ordem: 10,
    titulo: 'Atalhos no Dashboard',
    mensagem:
      'No Dashboard você tem atalhos para presença, justificativas, histórico e relatórios. Combine com um lembrete no celular no horário do estágio.',
    rotaSugerida: '/dashboard',
    anchorId: 'fy-dashboard-actions',
  },
  {
    id: 'encerramento',
    ordem: 11,
    titulo: 'Pronto',
    mensagem:
      'Fico no botão no canto: Dashboard, registrar presença, relatórios ou rever este tour. No fim do mês, não esqueça o PDF e o portal de assinatura. Bom trabalho!',
    rotaSugerida: '/dashboard',
    anchorId: null,
  },
]

export const FY_ONBOARDING_STORAGE_PREFIX = 'pointfy:fyOnboardingCompleted'

export function getFyOnboardingStorageKey(
  userId: string,
  variant: 'estagiario' | 'admin' | 'gestor',
): string {
  return `${FY_ONBOARDING_STORAGE_PREFIX}:${variant}:${userId}`
}

/** Dispensa temporária do tour na sessão (fechou o diálogo sem concluir). */
export function getFyOnboardingSessionDismissKey(
  userId: string,
  variant: 'estagiario' | 'admin' | 'gestor',
): string {
  return `pointfy:fyOnboardingDismissedSession:${variant}:${userId}`
}

export const FY_ADMIN_FIRST_VISIT_FLOW: FyOnboardingStep[] = [
  {
    id: 'admin-boas-vindas',
    ordem: 1,
    titulo: 'Painel administrativo',
    mensagem:
      'Você gerencia usuários, avisos, desafios e regras de presença. Estagiários baixam o relatório mensal em PDF e assinam no portal externo. Vou apontar cada módulo no menu.',
    rotaSugerida: '/dashboard/admin',
    anchorId: 'fy-admin-hero',
  },
  {
    id: 'admin-menu',
    ordem: 2,
    titulo: 'Menu admin',
    mensagem:
      'Menu admin: Usuários, Notificações, Desafios, Configurações e Justificativas. O relatório mensal em PDF ficou na área Relatórios do menu do estagiário.',
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
    id: 'admin-fechamento-mes',
    ordem: 5,
    titulo: 'Fechamento do mês',
    mensagem:
      'Cada estagiário gera o PDF em Relatórios (menu dele) e assina no portal de assinatura da empresa. Você acompanha totais aqui no painel e no histórico por usuário.',
    rotaSugerida: '/dashboard/admin',
    anchorId: 'fy-admin-hero',
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

export const FY_GESTOR_FIRST_VISIT_FLOW: FyOnboardingStep[] = [
  {
    id: 'gestor-painel',
    ordem: 1,
    titulo: 'Painel do gestor',
    mensagem:
      'Aqui você escolhe o estagiário vinculado a você e acompanha presença, histórico, justificativas e atividades. O PDF mensal ele baixa em Relatórios e assina no portal externo.',
    rotaSugerida: '/dashboard/gestor',
    anchorId: 'fy-gestor-panel',
  },
  {
    id: 'gestor-menu',
    ordem: 2,
    titulo: 'Menu',
    mensagem: 'O atalho “Meus estagiários” fica na barra lateral. Use o botão do Fy para rever este tour quando quiser.',
    rotaSugerida: null,
    anchorId: 'fy-sidebar-gestor',
  },
  {
    id: 'gestor-fim',
    ordem: 3,
    titulo: 'Pronto',
    mensagem:
      'Bom acompanhamento. Lembre o estagiário: após o PDF em Relatórios, a assinatura é no portal da empresa. Dúvidas de vínculo? Fale com o admin.',
    rotaSugerida: '/dashboard/gestor',
    anchorId: null,
  },
]

export type FyRouteHint = {
  emotion: FyEmotion
  text: string
}

const FY_ROUTE_HINTS: { prefix: string; hint: FyRouteHint }[] = [
  {
    prefix: '/dashboard/gestor',
    hint: {
      emotion: 'neutro',
      text: 'Selecione um estagiário na lista e use as abas para ver resumo, registros, histórico e justificativas.',
    },
  },
  { prefix: '/dashboard/ponto', hint: { emotion: 'neutro', text: 'Preenche os quatro horários e salva. Se passar do limite, escolhe justificativa antes.' } },
  { prefix: '/dashboard/historico', hint: { emotion: 'neutro', text: 'Confere totais por mês e o histórico de cada dia.' } },
  {
    prefix: '/dashboard/relatorios',
    hint: {
      emotion: 'neutro',
      text: 'Escolha o mês, baixe o PDF SENAI e depois assine no portal de assinatura da empresa — não é aqui no app.',
    },
  },
  { prefix: '/dashboard/justificativas', hint: { emotion: 'neutro', text: 'Envia ou acompanha justificativas. Resposta vem pelo fluxo do admin.' } },
  { prefix: '/dashboard/notificacoes', hint: { emotion: 'neutro', text: 'Avisos da equipe e do sistema ficam centralizados aqui.' } },
  { prefix: '/dashboard/admin/usuarios', hint: { emotion: 'neutro', text: 'Mantém dados dos estagiários alinhados com a realidade do estágio.' } },
  { prefix: '/dashboard/admin/notificacoes', hint: { emotion: 'neutro', text: 'Mensagens curtas e claras funcionam melhor para todo mundo ler.' } },
  { prefix: '/dashboard/admin/desafios', hint: { emotion: 'neutro', text: 'Desafios ativos respeitam o período que você definir.' } },
  { prefix: '/dashboard/admin/configuracoes-ponto', hint: { emotion: 'aviso', text: 'Mudança de config ativa afeta meta e limite de justificativa para todos.' } },
  { prefix: '/dashboard/admin/justificativas', hint: { emotion: 'neutro', text: 'Responde com objetividade — o estagiário vê o retorno no painel dele.' } },
  { prefix: '/dashboard/admin', hint: { emotion: 'neutro', text: 'Visão geral do admin. Use o menu para ir direto a cada módulo.' } },
  { prefix: '/dashboard', hint: { emotion: 'neutro', text: 'Resumo do dia, sequência e desafios. Atalho: Registrar Presença no menu.' } },
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
  if (prefix === '/dashboard' && pathname.startsWith('/dashboard/gestor')) return false
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
  isGestor: boolean
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

  if (
    !input.isAdmin &&
    !input.isGestor &&
    !input.hasPontoHoje &&
    !input.pathname.startsWith('/dashboard/ponto')
  ) {
    const day = new Date().getDay()
    if (day >= 1 && day <= 5) {
      return { emotion: 'atencao', text: 'Ainda não registrou presença hoje? Leva um minuto no menu “Registrar Presença”.' }
    }
  }

  const route = resolveFyRouteHint(input.pathname)
  if (route) return route

  return {
    emotion: 'neutro',
    text: pickStableQuickMessage(input.pathname, 'neutro'),
  }
}
