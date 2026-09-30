import { DEFAULT_ATESTADO_RH_EMAIL } from '@/lib/constants/atestado-rh'

/** @deprecated Use getAtestadoRhEmail() — mantido para imports legados. */
export const ATESTADO_RH_EMAIL = DEFAULT_ATESTADO_RH_EMAIL

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
