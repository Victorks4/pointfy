import { sendEmail } from '@/lib/server/email/mailer'

export type HrAlertEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

/** Envia alerta HR por e-mail; falha silenciosa se SMTP/Resend não configurado. */
export async function sendHrAlertEmail(input: HrAlertEmailInput): Promise<void> {
  try {
    await sendEmail({
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
  } catch (err) {
    console.warn('[sendHrAlertEmail]', err instanceof Error ? err.message : err)
  }
}
