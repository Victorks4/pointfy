import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server/auth'
import { DashboardAuthHydrate } from '@/components/dashboard-auth-hydrate'
import { DashboardClientLayout } from '@/components/dashboard-client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  return (
    <>
      <DashboardAuthHydrate user={user} />
      <DashboardClientLayout initialUser={user}>{children}</DashboardClientLayout>
    </>
  )
}
