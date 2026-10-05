/** Textos de anotação no relatório mensal (PDF / presença). */

export const RELATORIO_ANOTACAO = {
  FIM_DE_SEMANA_SABADO: 'Fim de semana (sábado)',
  FIM_DE_SEMANA_DOMINGO: 'Fim de semana (domingo)',
  FERIADO: (nome: string) => `Feriado: ${nome}`,
  RECESSO: 'Recesso',
} as const
