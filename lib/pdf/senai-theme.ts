import type jsPDF from 'jspdf'

/** Cores institucionais SENAI (aproximação da marca). */
export const SENAI = {
  blue: [0, 91, 170] as [number, number, number],
  blueLight: [230, 240, 250] as [number, number, number],
  orange: [242, 101, 34] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  line: [148, 163, 184] as [number, number, number],
  zebra: [248, 250, 252] as [number, number, number],
} as const

export const SENAI_LOGO_PATH = '/senai-logo.png'

export async function loadPublicImageDataUrl(path: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Não foi possível carregar a imagem: ${path}`)
  }
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Falha ao converter imagem'))
    }
    reader.onerror = () => reject(new Error('Falha ao ler imagem'))
    reader.readAsDataURL(blob)
  })
}

export function formatDateBr(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function senaiAutoTableCommon() {
  return {
    theme: 'grid' as const,
    headStyles: {
      fillColor: SENAI.blue,
      textColor: SENAI.white,
      fontStyle: 'bold' as const,
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak' as const,
      textColor: SENAI.text,
      lineColor: SENAI.line,
      lineWidth: 0.35,
    },
    alternateRowStyles: { fillColor: SENAI.zebra },
  }
}

export type SenaiHeaderResult = { contentStartY: number }

/** Cabeçalho com logo, título e linha laranja. */
export function drawSenaiHeader(
  doc: jsPDF,
  params: {
    logoDataUrl: string
    titulo: string
    subtitulo?: string
    marginX?: number
  },
): SenaiHeaderResult {
  const marginX = params.marginX ?? 40
  const pageW = doc.internal.pageSize.getWidth()
  const logoW = 100
  const logoH = 32

  doc.addImage(params.logoDataUrl, 'PNG', marginX, 28, logoW, logoH)

  doc.setTextColor(...SENAI.text)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(params.titulo, marginX + logoW + 14, 42)

  if (params.subtitulo) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SENAI.muted)
    doc.text(params.subtitulo, marginX + logoW + 14, 56)
  }

  const lineY = 72
  doc.setDrawColor(...SENAI.orange)
  doc.setLineWidth(2)
  doc.line(marginX, lineY, pageW - marginX, lineY)

  doc.setDrawColor(...SENAI.blue)
  doc.setLineWidth(0.5)
  doc.line(marginX, lineY + 4, pageW - marginX, lineY + 4)

  return { contentStartY: lineY + 18 }
}

/** Caixa de identificação com borda azul. */
export function drawInfoBox(
  doc: jsPDF,
  startY: number,
  lines: string[],
  marginX = 40,
): number {
  const pageW = doc.internal.pageSize.getWidth()
  const boxW = pageW - marginX * 2
  const lineH = 14
  const pad = 10
  const boxH = pad * 2 + lines.length * lineH

  doc.setDrawColor(...SENAI.blue)
  doc.setFillColor(...SENAI.blueLight)
  doc.setLineWidth(0.6)
  doc.roundedRect(marginX, startY, boxW, boxH, 4, 4, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SENAI.text)
  lines.forEach((line, i) => {
    doc.text(line, marginX + pad, startY + pad + 10 + i * lineH)
  })

  return startY + boxH + 12
}

export type SignatureBlockParams = {
  estagiarioNome: string
  gestorNome?: string | null
}

/** Rodapé com duas áreas de assinatura. */
export function drawSignatureFooter(
  doc: jsPDF,
  y: number,
  params: SignatureBlockParams,
  marginX = 40,
): number {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const blockH = 88
  const gap = 16
  const colW = (pageW - marginX * 2 - gap) / 2

  if (y + blockH + 24 > pageH) {
    doc.addPage()
    y = 48
  }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SENAI.text)
  doc.text('Assinaturas', marginX, y)
  y += 16

  const drawSlot = (x: number, label: string, nome: string) => {
    doc.setDrawColor(...SENAI.line)
    doc.setLineWidth(0.5)
    doc.line(x, y + 36, x + colW, y + 36)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SENAI.blue)
    doc.text(label, x, y + 8)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SENAI.text)
    doc.text(`Nome: ${nome}`, x, y + 20)

    doc.setTextColor(...SENAI.muted)
    doc.text('Data: ___/___/______', x, y + 48)
  }

  drawSlot(marginX, 'Assinatura do(a) estagiário(a)', params.estagiarioNome)
  drawSlot(
    marginX + colW + gap,
    'Assinatura do(a) gestor(a) / responsável',
    params.gestorNome?.trim() || '—',
  )

  return y + blockH + 8
}
