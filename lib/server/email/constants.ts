/** Destinatário fixo do RH para cópia de atestados anexados. */
export const ATESTADO_RH_EMAIL = 'ngpsenaifeira@fieb.org.br'

export function getEmailFromAddress(): string {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    'Pontify <noreply@pontify.local>'
  )
}

export function isOutboundEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim())
}
