/** A partir deste dia do mês o gestor e o estagiário podem assinar a folha de ponto em fechamento. */
export const DIA_INICIO_ASSINATURA_FOLHA = 28

export function isPeriodoAssinaturaFolhaPonto(data: Date): boolean {
  return data.getDate() >= DIA_INICIO_ASSINATURA_FOLHA
}

/** Mês civil em fechamento quando a assinatura é feita (ex.: 28–31/04 → abril). */
export function mesAnoFechamentoAtual(data: Date): string {
  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
