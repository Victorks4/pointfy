import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { formatMinutesToDisplay } from '@/lib/time-utils'

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

export function downloadRelatorioEstagiariosPdf(params: {
  titulo: string
  filtroDepartamento: string
  linhas: RelatorioEstagiarioRow[]
  periodoLabel: string
  filename: string
}) {
  const { linhas, titulo, filtroDepartamento, periodoLabel, filename } = params

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  doc.setFontSize(14)
  doc.text(titulo, 40, 40)

  doc.setFontSize(10)
  doc.text(`Período: ${periodoLabel}`, 40, 58)
  doc.text(
    `Departamento: ${filtroDepartamento || 'Todos'}`,
    40,
    72
  )

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
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240] },
    styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
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
}) {
  const { titulo, periodoLabel, usuario, bancoHorasMinutos, pontos, filename } = params

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

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
    startY: 120,
    head: [['Data', 'Entrada 1', 'Saída 1', 'Entrada 2', 'Saída 2', 'Total']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240] },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 70 },
      2: { cellWidth: 70 },
      3: { cellWidth: 70 },
      4: { cellWidth: 70 },
      5: { cellWidth: 90, halign: 'right' },
    },
  })

  doc.save(filename)
}

