import { Skeleton } from '@/components/ui/skeleton'

export default function JustificativasLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}
