import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 items-start justify-center px-6 py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-5 border border-transparent p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="space-y-4 border border-transparent p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        <div className="space-y-4 border border-transparent p-6">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </main>
  );
}
