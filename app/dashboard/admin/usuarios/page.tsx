'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Skeleton className="h-10 w-48" />
    </div>
  )
}

const UsuariosClient = dynamic(() => import('./usuarios-client'), {
  loading: () => <PageLoading />,
})

export default function UsuariosAdminPage() {
  return <UsuariosClient />
}
