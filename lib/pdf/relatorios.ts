import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { formatMinutesToDisplay } from '@/lib/time-utils'

/** Paleta: preto, branco e cinza legível (cabeçalho escuro + texto branco). */
const PDF = {
  text: [15, 23, 42] as [number, number, number],
  muted: [82, 82, 91] as [number, number, number],
  headBg: [63, 63, 70] as [number, number, number],
  headText: [255, 255, 255] as [number, number, number],
  line: [100, 100, 100] as [number, number, number],
  zebra: [248, 248, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

function autoTableCommon() {
  return {
    theme: 'grid' as const,
    headStyles: {
      fillColor: PDF.headBg,
      textColor: PDF.headText,
      fontStyle: 'bold' as const,
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak' as const,
      textColor: PDF.text,
      lineColor: PDF.line,
      lineWidth: 0.35,
    },
    alternateRowStyles: { fillColor: PDF.zebra },
  }
}

function addImageDataUrl(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): boolean {
  try {
    const fmt = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
    doc.addImage(dataUrl, fmt, x, y, maxW, maxH)
    return true
  } catch {
    return false
  }
}

function drawSignatureSlot(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  nome: string,
  dataUrl: string | null | undefined,
  dataAssinatura: string | null | undefined,
) {
  doc.setFontSize(9)
  doc.setTextColor(...PDF.text)
  doc.text(title, x, y)
  doc.setFontSize(8)
  doc.setTextColor(...PDF.muted)
  doc.text(nome, x, y + 12)

  const boxY = y + 18
  doc.setDrawColor(...PDF.line)
  doc.setLineWidth(0.5)
  doc.rect(x, boxY, w, h)

  if (dataUrl) {
    const ok = addImageDataUrl(doc, dataUrl, x + 2, boxY + 2, w - 4, h - 4)
    if (!ok) {
      doc.setFontSize(8)
      doc.setTextColor(...PDF.muted)
      doc.text('(imagem da assinatura indisponível)', x + 4, boxY + h / 2)
    }
  }

  if (dataAssinatura) {
    doc.setFontSize(7)
    doc.setTextColor(...PDF.muted)
    const label = `Assinado em: ${new Date(dataAssinatura).toLocaleString('pt-BR')}`
    doc.text(label, x, boxY + h + 10)
  }
}

export type RelatorioEstagiarioRow = {
  nome: string
  ra: string
  departamento: string
  registros: number
  bancoHorasMinutos: number
}

export type PontoDetalhe = {
  data: string
  entrada1: string | null
  saida1: string | null
  entrada2: string | null
  saida2: string | null
  totalMinutos: number
}

export type RelatorioUsuarioAssinaturasPdf = {
  gestorNome: string
  estagiarioNome: string
  gestorDataUrl: string | null
  estagiarioDataUrl: string | null
  gestorAssinouEm: string | null
  estagiarioAssinouEm: string | null
}

export function downloadRelatorioEstagiariosPdf(params: {
  titulo: string
  filtroDepartamento: string
  linhas: RelatorioEstagiarioRow[]
  periodoLabel: string
  filename: string
}) {
  const { linhas, titulo, filtroDepartamento, periodoLabel, filename } = params

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  doc.setTextColor(...PDF.text)
  doc.setFontSize(14)
  doc.text(titulo, 40, 40)

  doc.setFontSize(10)
  doc.text(`Período: ${periodoLabel}`, 40, 58)
  doc.text(`Departamento: ${filtroDepartamento || 'Todos'}`, 40, 72)

  const body = linhas.map((l) => [
    l.nome,
    l.ra,
    l.departamento,
    String(l.registros),
    formatMinutesToDisplay(l.bancoHorasMinutos),
  ])

  autoTable(doc, {
    startY: 90,
    head: [['Nome', 'RA', 'Departamento', 'Registros', 'Banco de Horas']],
    body,
    ...autoTableCommon(),
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60 },
      2: { cellWidth: 90 },
      3: { cellWidth: 70, halign: 'right' },
      4: { cellWidth: 100, halign: 'right' },
    },
  })

  doc.save(filename)
}

export function downloadRelatorioUsuarioPdf(params: {
  titulo: string
  periodoLabel: string
  usuario: {
    nome: string
    ra: string
    departamento: string
  }
  bancoHorasMinutos: number
  pontos: PontoDetalhe[]
  filename: string
  assinaturas?: RelatorioUsuarioAssinaturasPdf | null
}) {
  const { titulo, periodoLabel, usuario, bancoHorasMinutos, pontos, filename, assinaturas } = params

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  doc.setTextColor(...PDF.text)
  doc.setFontSize(14)
  doc.text(titulo, 40, 40)

  doc.setFontSize(10)
  doc.text(`Período: ${periodoLabel}`, 40, 58)
  doc.text(`Usuário: ${usuario.nome} (${usuario.ra})`, 40, 72)
  doc.text(`Departamento: ${usuario.departamento}`, 40, 86)
  doc.text(`Banco de Horas: ${formatMinutesToDisplay(bancoHorasMinutos)}`, 40, 100)

  const body = pontos.map((p) => [
    p.data,
    p.entrada1 ?? '--:--',
    p.saida1 ?? '--:--',
    p.entrada2 ?? '--:--',
    p.saida2 ?? '--:--',
    formatMinutesToDisplay(p.totalMinutos),
  ])

  autoTable(doc, {
    startY: 118,
    head: [['Data', 'Entrada 1', 'Saída 1', 'Entrada 2', 'Saída 2', 'Total']],
    body,
    ...autoTableCommon(),
    styles: { ...autoTableCommon().styles, fontSize: 8, cellPadding: 3 },
    headStyles: { ...autoTableCommon().headStyles, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 68 },
      2: { cellWidth: 68 },
      3: { cellWidth: 68 },
      4: { cellWidth: 68 },
      5: { cellWidth: 88, halign: 'right' },
    },
  })

  const docExt = doc as unknown as { lastAutoTable?: { finalY: number } }
  let y = (docExt.lastAutoTable?.finalY ?? 200) + 28

  const pageH = doc.internal.pageSize.getHeight()
  const slotW = 235
  const slotH = 56

  if (assinaturas) {
    if (y + slotH + 48 > pageH) {
      doc.addPage()
      y = 48
    }

    doc.setFontSize(10)
    doc.setTextColor(...PDF.text)
    doc.text('Assinaturas da folha de ponto', 40, y)
    y += 22

    drawSignatureSlot(
      doc,
      40,
      y,
      slotW,
      slotH,
      'Assinatura do gestor',
      assinaturas.gestorNome,
      assinaturas.gestorDataUrl,
      assinaturas.gestorAssinouEm,
    )

    drawSignatureSlot(
      doc,
      40 + slotW + 20,
      y,
      slotW,
      slotH,
      'Assinatura do estagiário',
      assinaturas.estagiarioNome,
      assinaturas.estagiarioDataUrl,
      assinaturas.estagiarioAssinouEm,
    )
  } else {
    if (y + slotH + 40 > pageH) {
      doc.addPage()
      y = 48
    }
    doc.setFontSize(10)
    doc.setTextColor(...PDF.text)
    doc.text('Assinaturas da folha de ponto', 40, y)
    y += 22

    drawSignatureSlot(doc, 40, y, slotW, slotH, 'Assinatura do gestor', '—', null, null)
    drawSignatureSlot(doc, 40 + slotW + 20, y, slotW, slotH, 'Assinatura do estagiário', usuario.nome, null, null)
  }

  doc.save(filename)
}
