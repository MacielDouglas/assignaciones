import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-56 rounded-full" />
          <Skeleton className="h-6 w-56 rounded-full" />
        </div>

        <div className="space-y-4">
          <div className="inline-flex rounded-xl border p-1">
            <Skeleton className="h-8 w-36 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>

          <Skeleton className="h-9 w-full rounded-xl" />

          <div className="space-y-4">
            <div className="rounded-2xl border p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-56" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
