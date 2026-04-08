import type { FyTipRole } from '@/lib/fy-mascot'

export type FyFaqItem = {
  id: string
  question: string
  /** Texto que o Fy “fala” ao usuário — tom alinhado ao FY_SYSTEM_PROMPT. */
  answer: string
  /** Se omitido, a pergunta aparece para todos os perfis. */
  roles?: readonly FyTipRole[]
}

const FY_FAQ_ITEMS: readonly FyFaqItem[] = [
  {
    id: 'horario-formato',
    question: 'Que formato uso nos horários de ponto?',
    answer:
      'Use sempre relógio de 24 horas no estilo HH:mm, por exemplo 08:15 ou 17:45. O sistema compara entrada e saída nessa base: a saída precisa ser depois da entrada no mesmo período.',
  },
  {
    id: 'rh-empresa',
    question: 'Quem responde sobre contrato ou políticas da empresa?',
    answer:
      'No Pontify o foco é registro de ponto, histórico e justificativas. Para contrato, benefícios ou regras internas da instituição, procure o RH ou seu coordenador de estágio.',
  },
  {
    id: 'onde-registrar',
    question: 'Onde registro meu ponto?',
    answer:
      'No menu lateral, abra “Registrar Ponto”. Lá você preenche os horários do dia (até quatro marcos: duas entradas e duas saídas) e confirma com o botão de registrar. No dashboard também há atalhos rápidos.',
    roles: ['estagiario'],
  },
  {
    id: 'historico',
    question: 'Onde vejo meus dias e totais anteriores?',
    answer:
      'Em “Histórico” você filtra por mês e ano, vê cada dia com horários e o total do período, além do saldo de banco de horas exibido no resumo.',
    roles: ['estagiario'],
  },
  {
    id: 'justificativa',
    question: 'Quando preciso enviar justificativa?',
    answer:
      'Se o admin configurou um limite de minutos por dia e você passa dele sem motivo aceito, o sistema pede uma justificativa antes de salvar. Atestados e compensações entram em “Justificativas”; o administrador analisa e você vê o retorno ali.',
    roles: ['estagiario'],
  },
  {
    id: 'banco-horas',
    question: 'O que é banco de horas?',
    answer:
      'É a diferença entre o que você registrou e a carga esperada no período (com base na sua jornada). Positivo indica horas a mais; negativo, horas a compensar. O histórico e o dashboard mostram esse saldo para você acompanhar.',
    roles: ['estagiario'],
  },
  {
    id: 'notificacoes',
    question: 'Para que servem as notificações?',
    answer:
      'Centralizam avisos da equipe e lembretes do sistema. Vale abrir com frequência para não perder comunicados sobre recesso, regras ou retorno de justificativas.',
    roles: ['estagiario'],
  },
  {
    id: 'desafios',
    question: 'O que são os desafios da semana?',
    answer:
      'São metas temporárias (horas, dias seguidos, pontualidade etc.) definidas pelo admin. Você acompanha o progresso nos cards do dashboard; concluir ajuda no engajamento e no hábito de registrar direitinho.',
    roles: ['estagiario'],
  },
  {
    id: 'sequencia-produtividade',
    question: 'O que é “sequência” e a pontuação do dashboard?',
    answer:
      'A sequência conta dias seguidos com registro de ponto. A pontuação mistura consistência, bater a meta diária e pontualidade. Manter o ritmo sobe os indicadores — é um retrato do seu hábito, não uma nota escolar.',
    roles: ['estagiario'],
  },
  {
    id: 'admin-usuarios',
    question: 'Como cadastro estagiários e gestores?',
    answer:
      'Em Administração → Usuários você cria perfis como Estagiário ou Gestor, define departamento e carga horária. Para estagiário, pode vincular um gestor responsável para ele aparecer no painel “Meus estagiários” do coordenador.',
    roles: ['admin'],
  },
  {
    id: 'admin-config-ponto',
    question: 'O que a configuração de ponto altera?',
    answer:
      'A regra ativa vale para todo mundo: meta de horas por dia, limite acima do qual exige justificativa, horário esperado de entrada e outras opções. Qualquer mudança combina com o RH antes de publicar.',
    roles: ['admin'],
  },
  {
    id: 'admin-relatorios',
    question: 'Como fecho o mês com relatórios?',
    answer:
      'Em Relatórios você filtra por período e departamento, revisa totais e pode exportar em PDF para alinhar com a coordenação ou o RH.',
    roles: ['admin'],
  },
  {
    id: 'gestor-painel',
    question: 'O que eu vejo no painel do gestor?',
    answer:
      'Só estagiários vinculados a você no cadastro. Para cada um há abas de resumo, registros de ponto, histórico por mês, justificativas e uma linha do tempo com notificações e atividades recentes.',
    roles: ['gestor'],
  },
  {
    id: 'gestor-sem-estagiario',
    question: 'Por que não aparece nenhum estagiário para mim?',
    answer:
      'O administrador precisa marcar você como gestor responsável no cadastro do estagiário. Se a lista está vazia, fale com o admin em Usuários para conferir o vínculo.',
    roles: ['gestor'],
  },
  {
    id: 'gestor-historico',
    question: 'Posso abrir o histórico como o estagiário vê?',
    answer:
      'Sim. No seu painel use “Histórico em tela cheia” ou acesse Histórico com o parâmetro do estagiário — o sistema só libera se ele estiver vinculado a você.',
    roles: ['gestor'],
  },
]

function isVisibleForRole(item: FyFaqItem, role: FyTipRole): boolean {
  if (item.roles === undefined || item.roles.length === 0) return true
  return item.roles.includes(role)
}

export function getFyFaqItemsForRole(role: FyTipRole): FyFaqItem[] {
  return FY_FAQ_ITEMS.filter((item) => isVisibleForRole(item, role))
}
