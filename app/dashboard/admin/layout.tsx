import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/server/auth'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole('admin')
  } catch {
    redirect('/dashboard')
  }
  return children
}
