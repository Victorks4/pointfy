import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server/auth'
import { DashboardAuthHydrate } from '@/components/dashboard/dashboard-auth-hydrate'
import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { ServerUserProvider } from '@/components/shared/server-user-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/')

  return (
    <ServerUserProvider user={user}>
      <DashboardAuthHydrate user={user} />
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </ServerUserProvider>
  )
}
