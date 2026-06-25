import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server/auth'
import { DashboardAuthHydrate } from '@/components/dashboard-auth-hydrate'
import { DashboardClientLayout } from '@/components/dashboard-client-layout'
import { ServerUserProvider } from '@/components/server-user-provider'

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
