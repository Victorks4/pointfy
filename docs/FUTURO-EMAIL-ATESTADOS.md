# Implementacao futura - e-mail de atestados ao RH

Status atual: anexo obrigatorio; atestado salvo no Supabase; RH ve no painel admin. Resend/SMTP nao e obrigatorio no go-live.

Ao configurar RESEND_API_KEY + EMAIL_FROM ou SMTP_* no Render, o codigo envia copia apos salvar (maybeSendAtestadoCopyToRh).

## Resend

1. resend.com - API Keys (re_...)
2. Domains: dominio de e-mail (ex. fieb.org.br), nao URL do Render. DNS DKIM/SPF pela TI. Cuidado: org.br nao orb.br.
3. Render: RESEND_API_KEY, EMAIL_FROM=PontiFy <noreply@fieb.org.br>, opcional ATESTADO_RH_EMAIL=ngpsenaifeira@fieb.org.br

Remetente = sistema. Destinatario = RH.

## SMTP FIEB (alternativa)

SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM. Sem RESEND_API_KEY para usar so SMTP.

## Arquivos no codigo

lib/constants/atestado-rh.ts, lib/server/email/atestado-email-config.ts, send-atestado-rh.ts, mailer.ts, justificativa.service.ts

## Desligar e-mail

Remover vars de e-mail do Render; atestados continuam no app.