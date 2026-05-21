import { Skeleton } from '@/components/ui/skeleton'

export default function PontoLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <Skeleton className="h-14 w-full shrink-0" />
      <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 w-full max-w-md rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}
