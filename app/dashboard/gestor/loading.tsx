import { Skeleton } from '@/components/ui/skeleton'

export default function GestorLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full max-w-md" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
