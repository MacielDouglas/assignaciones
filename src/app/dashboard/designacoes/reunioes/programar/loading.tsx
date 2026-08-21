import { Skeleton } from "@/components/ui/skeleton";

function AccentSectionSkeleton({ tint }: { tint: string }) {
  return (
    <div
      className="space-y-4 rounded-2xl border p-4 sm:p-5"
      style={{
        backgroundColor: `color-mix(in srgb, ${tint} 8%, var(--card))`,
        borderColor: `color-mix(in srgb, ${tint} 28%, transparent)`,
      }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" style={{ backgroundColor: tint }} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
          <div key={index} className="grid gap-2 py-1 sm:grid-cols-[3.5rem_1fr_13rem] sm:gap-4">
            <Skeleton className="h-4 w-10" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-52 max-w-full" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlainSectionSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border p-6">
      <Skeleton className="h-5 w-44" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
          <div key={index} className="grid gap-2 py-1 sm:grid-cols-[3.5rem_1fr_13rem] sm:gap-4">
            <Skeleton className="h-4 w-10" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-52 max-w-full" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-1">
          <Skeleton className="h-8 w-28 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-72 sm:h-12" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-6 w-48 rounded-full" />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        <AccentSectionSkeleton tint="#3c7f8b" />
        <AccentSectionSkeleton tint="#d68f00" />
        <AccentSectionSkeleton tint="#bf2f13" />
        <PlainSectionSkeleton />
      </div>
    </main>
  );
}
