import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { LABELS } from '@/lib/labels'
import { formatMinutesToDisplay } from '@/lib/time-utils'
import {
  SENAI,
  SENAI_LOGO_PATH,
  drawInfoBox,
  drawSenaiHeader,
  drawSignatureFooter,
  formatDateBr,
  loadPublicImageDataUrl,
  senaiAutoTableCommon,
} from '@/lib/pdf/senai-theme'

export type RelatorioEstagiarioRow = {
  nome: string
  matricula: string
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
  observacao?: string | null
}

export async function downloadRelatorioEstagiariosPdf(params: {
  titulo: string
  filtroDepartamento: string
  linhas: RelatorioEstagiarioRow[]
  periodoLabel: string
  filename: string
}) {
  const { linhas, titulo, filtroDepartamento, periodoLabel, filename } = params
  const logoDataUrl = await loadPublicImageDataUrl(SENAI_LOGO_PATH)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const { contentStartY } = drawSenaiHeader(doc, {
    logoDataUrl,
    titulo: titulo.toUpperCase(),
    subtitulo: `Período: ${periodoLabel}`,
  })

  let y = drawInfoBox(doc, contentStartY, [
    `${LABELS.LOTACAO}: ${filtroDepartamento || 'Todas'}`,
    `Total de registros na listagem: ${linhas.length}`,
  ])

  const body = linhas.map((l) => [
    l.nome,
    l.matricula,
    l.departamento,
    String(l.registros),
    formatMinutesToDisplay(l.bancoHorasMinutos),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Nome', 'Matrícula', LABELS.LOTACAO, 'Registros', LABELS.SALDO]],
    body,
    ...senaiAutoTableCommon(),
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

export async function downloadRelatorioUsuarioPdf(params: {
  titulo: string
  periodoLabel: string
  usuario: {
    nome: string
    matricula: string
    departamento: string
  }
  gestorNome?: string | null
  bancoHorasMinutos: number
  totalHorasMesMinutos: number
  totalHorasGeralMinutos: number
  pontos: PontoDetalhe[]
  filename: string
}) {
  const {
    titulo,
    periodoLabel,
    usuario,
    gestorNome,
    bancoHorasMinutos,
    totalHorasMesMinutos,
    totalHorasGeralMinutos,
    pontos,
    filename,
  } = params

  const logoDataUrl = await loadPublicImageDataUrl(SENAI_LOGO_PATH)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const { contentStartY } = drawSenaiHeader(doc, {
    logoDataUrl,
    titulo: 'RELATÓRIO DE PRESENÇA',
    subtitulo: `${titulo} · ${periodoLabel}`,
  })

  let y = drawInfoBox(doc, contentStartY, [
    `Estagiário(a): ${usuario.nome}`,
    `Matrícula: ${usuario.matricula}`,
    `${LABELS.LOTACAO}: ${usuario.departamento}`,
    `Gestor(a) / responsável: ${gestorNome?.trim() || '—'}`,
    `Período: ${periodoLabel}`,
  ])

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SENAI.text)
  doc.text(`${LABELS.SALDO} no período: ${formatMinutesToDisplay(bancoHorasMinutos)}`, 40, y)
  y += 14
  doc.text(`Total de horas no período: ${formatMinutesToDisplay(totalHorasMesMinutos)}`, 40, y)
  y += 14
  doc.text(`Total de horas (todos os meses): ${formatMinutesToDisplay(totalHorasGeralMinutos)}`, 40, y)
  y += 18

  const body = pontos.map((p) => [
    formatDateBr(p.data),
    p.entrada1 ?? '--:--',
    p.saida1 ?? '--:--',
    p.entrada2 ?? '--:--',
    p.saida2 ?? '--:--',
    formatMinutesToDisplay(p.totalMinutos),
    p.observacao?.trim() || '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Entrada 1', 'Saída 1', 'Entrada 2', 'Saída 2', 'Total', 'Observação']],
    body,
    ...senaiAutoTableCommon(),
    styles: { ...senaiAutoTableCommon().styles, fontSize: 7, cellPadding: 3 },
    headStyles: { ...senaiAutoTableCommon().headStyles, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 52 },
      2: { cellWidth: 52 },
      3: { cellWidth: 52 },
      4: { cellWidth: 52 },
      5: { cellWidth: 58, halign: 'right' },
      6: { cellWidth: 110 },
    },
  })

  const docExt = doc as unknown as { lastAutoTable?: { finalY: number } }
  const tableEndY = (docExt.lastAutoTable?.finalY ?? y) + 24

  drawSignatureFooter(doc, tableEndY, {
    estagiarioNome: usuario.nome,
    gestorNome,
  })

  doc.save(filename)
}
