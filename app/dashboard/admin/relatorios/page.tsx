import { redirect } from 'next/navigation'

/** Relatórios movidos para a visão do estagiário (/dashboard/relatorios). */
export default function AdminRelatoriosRedirect() {
  redirect('/dashboard/admin')
}
