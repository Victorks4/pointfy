import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/server/auth'

export default async function GestorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole('gestor')
  } catch {
    redirect('/dashboard')
  }
  return children
}
