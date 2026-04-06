/**
 * Fy — mascote do Pontify (guia no app).
 * Imagem: /fy-mascote.png (fundo transparente).
 */

export const FY_NAME = 'Fy'

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
      'Sou o guia do Pontify. Vou te mostrar o básico em poucos passos — sem enrolação.',
    rotaSugerida: '/dashboard',
  },
  {
    id: 'menu-lateral',
    ordem: 2,
    titulo: 'Menu lateral',
    mensagem:
      'Todas as áreas ficam aqui: ponto, histórico, justificativas e notificações. É só clicar.',
    rotaSugerida: null,
  },
  {
    id: 'registrar-ponto',
    ordem: 3,
    titulo: 'Registrar ponto',
    mensagem:
      'Em “Registro de ponto” você preenche os horários do dia e salva. Use o relógio do sistema para não errar o formato.',
    rotaSugerida: '/dashboard/ponto',
  },
  {
    id: 'regras-horario',
    ordem: 4,
    titulo: 'Regras rápidas',
    mensagem:
      'Horário no formato HH:MM, saída depois da entrada, sem sobrepor períodos. Se passar do limite, a justificativa vira obrigatória.',
    rotaSugerida: '/dashboard/ponto',
  },
  {
    id: 'justificativas',
    ordem: 5,
    titulo: 'Justificativas',
    mensagem:
      'Se precisar justificar hora extra ou enviar algo formal, use a área de justificativas. O admin vê e responde por lá.',
    rotaSugerida: '/dashboard/justificativas',
  },
  {
    id: 'historico',
    ordem: 6,
    titulo: 'Histórico',
    mensagem:
      'No histórico você revisa dias anteriores e totais. Bom para conferir antes de falar com o RH.',
    rotaSugerida: '/dashboard/historico',
  },
  {
    id: 'notificacoes',
    ordem: 7,
    titulo: 'Notificações',
    mensagem:
      'Avisos importantes aparecem nas notificações. Vale dar uma passada de vez em quando.',
    rotaSugerida: '/dashboard/notificacoes',
  },
  {
    id: 'lembrete-diario',
    ordem: 8,
    titulo: 'Não esquecer',
    mensagem:
      'Dica: define um lembrete no celular no horário que você costuma chegar ou sair. O Pontify registra, mas o hábito é seu.',
    rotaSugerida: null,
  },
  {
    id: 'encerramento',
    ordem: 9,
    titulo: 'Pronto',
    mensagem:
      'Qualquer dúvida, me chama de novo pelo guia. Bons estudos e bom estágio!',
    rotaSugerida: '/dashboard',
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
      'Como admin, você gerencia usuários, avisos e regras de ponto. O Fy resume o que importa em cada área.',
    rotaSugerida: '/dashboard/admin',
  },
  {
    id: 'admin-usuarios',
    ordem: 2,
    titulo: 'Usuários',
    mensagem:
      'Cadastre e edite estagiários, cargas horárias e recesso. Tudo que impacta o ponto passa por aqui.',
    rotaSugerida: '/dashboard/admin/usuarios',
  },
  {
    id: 'admin-notificacoes',
    ordem: 3,
    titulo: 'Notificações',
    mensagem:
      'Envie avisos para a equipe. Eles aparecem na área de notificações de cada estagiário.',
    rotaSugerida: '/dashboard/admin/notificacoes',
  },
  {
    id: 'admin-relatorios',
    ordem: 4,
    titulo: 'Relatórios',
    mensagem:
      'Exporte e analise registros. Use para conferência com o RH ou coordenação.',
    rotaSugerida: '/dashboard/admin/relatorios',
  },
  {
    id: 'admin-desafios',
    ordem: 5,
    titulo: 'Desafios semanais',
    mensagem:
      'Crie metas semanais para engajar o time. Acompanhe o progresso no dashboard dos estagiários.',
    rotaSugerida: '/dashboard/admin/desafios',
  },
  {
    id: 'admin-config',
    ordem: 6,
    titulo: 'Configurações de ponto',
    mensagem:
      'Perfis de meta diária, limite para justificativa e regras de minutos. Só uma config fica ativa por vez.',
    rotaSugerida: '/dashboard/admin/configuracoes-ponto',
  },
  {
    id: 'admin-justificativas',
    ordem: 7,
    titulo: 'Justificativas (admin)',
    mensagem:
      'Revista e responda solicitações dos estagiários nesta fila.',
    rotaSugerida: '/dashboard/admin/justificativas',
  },
  {
    id: 'admin-fim',
    ordem: 8,
    titulo: 'Pronto',
    mensagem:
      'Dúvidas sobre o sistema? O Fy continua no canto da tela para lembrar atalhos e boas práticas.',
    rotaSugerida: '/dashboard/admin',
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
