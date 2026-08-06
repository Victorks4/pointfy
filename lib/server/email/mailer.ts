import nodemailer from 'nodemailer'
import { getEmailFromAddress } from '@/lib/server/email/constants'

export type EmailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text: string
  attachments?: EmailAttachment[]
}

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) throw new Error('RESEND_API_KEY não configurada')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFromAddress(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content.toString('base64'),
        content_type: file.contentType,
      })),
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Falha ao enviar e-mail (Resend): ${response.status} ${body}`.trim())
  }
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) throw new Error('SMTP_HOST não configurado')

  const port = Number(process.env.SMTP_PORT ?? 587)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })

  await transporter.sendMail({
    from: getEmailFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments?.map((file) => ({
      filename: file.filename,
      content: file.content,
      contentType: file.contentType,
    })),
  })
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend(input)
    return
  }

  if (process.env.SMTP_HOST?.trim()) {
    await sendViaSmtp(input)
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('[email] Envio ignorado (configure RESEND_API_KEY ou SMTP_HOST):', input.subject)
    return
  }

  throw new Error('Serviço de e-mail não configurado no servidor')
}
