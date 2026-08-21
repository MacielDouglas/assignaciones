import { Skeleton } from "@/components/ui/skeleton";

function ScheduleRowSkeleton() {
  return (
    <div className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 py-2">
      <Skeleton className="h-4 w-10" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-52 max-w-full" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

function MeetingCardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-6 w-52 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 border-t pt-4">
        <Skeleton className="h-3.5 w-32" />
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
          <ScheduleRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 sm:h-12 sm:w-64" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-44 rounded-full sm:block" />
      </header>

      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>

      <div className="flex items-center justify-between rounded-2xl border px-2 py-2">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-5 w-52 max-w-full" />
        <Skeleton className="size-10 rounded-full" />
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
        <MeetingCardSkeleton key={index} />
      ))}
    </main>
  );
}
