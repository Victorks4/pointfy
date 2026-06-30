import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/server/auth'
import { AdminHrScheduler } from '@/components/admin-hr-scheduler'

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
  return (
    <>
      <AdminHrScheduler />
      {children}
    </>
  )
}
