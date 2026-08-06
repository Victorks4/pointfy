import { createAdminClient } from '@/lib/supabase/admin'
import { ATESTADO_RH_EMAIL } from '@/lib/server/email/constants'
import { sendEmail } from '@/lib/server/email/mailer'
import { formatDate } from '@/lib/time-utils'

export type AtestadoRhEmailContext = {
  estagiarioNome: string
  estagiarioEmail: string
  matricula: string
  lotacao: string
  dataAusencia: string
  descricao: string
  arquivoPath: string
}

function filenameFromStoragePath(path: string): string {
  const base = path.split('/').pop()
  return base && base.length > 0 ? base : 'atestado-anexo'
}

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

export async function sendAtestadoCopyToRh(ctx: AtestadoRhEmailContext): Promise<void> {
  const admin = createAdminClient()
  const { data: file, error } = await admin.storage.from('justificativas').download(ctx.arquivoPath)

  if (error || !file) {
    throw new Error('Não foi possível ler o anexo do atestado para envio ao RH')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = filenameFromStoragePath(ctx.arquivoPath)
  const dataFormatada = formatDate(ctx.dataAusencia)

  const subject = `[Pontify] Atestado — ${ctx.estagiarioNome} — ${dataFormatada}`
  const text = [
    'Novo atestado enviado pelo Pontify.',
    '',
    `Estagiário: ${ctx.estagiarioNome}`,
    `E-mail: ${ctx.estagiarioEmail}`,
    `Matrícula: ${ctx.matricula}`,
    `Lotação: ${ctx.lotacao}`,
    `Data da ausência: ${dataFormatada}`,
    '',
    'Descrição:',
    ctx.descricao,
    '',
    'O documento está em anexo neste e-mail.',
  ].join('\n')

  const html = `
    <p>Novo atestado enviado pelo <strong>Pontify</strong>.</p>
    <ul>
      <li><strong>Estagiário:</strong> ${escapeHtml(ctx.estagiarioNome)}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(ctx.estagiarioEmail)}</li>
      <li><strong>Matrícula:</strong> ${escapeHtml(ctx.matricula)}</li>
      <li><strong>Lotação:</strong> ${escapeHtml(ctx.lotacao)}</li>
      <li><strong>Data da ausência:</strong> ${escapeHtml(dataFormatada)}</li>
    </ul>
    <p><strong>Descrição:</strong><br />${escapeHtml(ctx.descricao).replace(/\n/g, '<br />')}</p>
    <p>O documento está em anexo neste e-mail.</p>
  `.trim()

  await sendEmail({
    to: ATESTADO_RH_EMAIL,
    subject,
    html,
    text,
    attachments: [
      {
        filename,
        content: buffer,
        contentType: guessContentType(filename),
      },
    ],
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
