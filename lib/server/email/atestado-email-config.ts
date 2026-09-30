import { DEFAULT_ATESTADO_RH_EMAIL } from '@/lib/constants/atestado-rh'
import { isOutboundEmailConfigured } from '@/lib/server/email/constants'
import {
  sendAtestadoCopyToRh,
  type AtestadoRhEmailContext,
} from '@/lib/server/email/send-atestado-rh'

export function getAtestadoRhEmail(): string {
  const fromEnv = process.env.ATESTADO_RH_EMAIL?.trim()
  if (fromEnv && fromEnv.includes('@')) return fromEnv
  return DEFAULT_ATESTADO_RH_EMAIL
}

/**
 * Envia cópia ao RH quando RESEND/SMTP estiver configurado.
 * Hoje o envio é opcional (implementação futura); falhas não impedem salvar o atestado.
 */
export async function maybeSendAtestadoCopyToRh(ctx: AtestadoRhEmailContext): Promise<void> {
  if (!isOutboundEmailConfigured()) {
    return
  }

  try {
    await sendAtestadoCopyToRh(ctx)
  } catch (err) {
    console.error(
      '[atestado-rh] Falha ao enviar cópia ao RH (atestado permanece registrado):',
      err instanceof Error ? err.message : err,
    )
  }
}
