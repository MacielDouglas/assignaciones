import { Skeleton } from "@/components/ui/skeleton";

function MemberCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border p-6">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function PeopleRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <div className="flex shrink-0 gap-2">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
      </div>
    </div>
  );
}

function TokenRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
      </div>
    </div>
  );
}

export default async function Loading({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab =
    params?.tab === "irmaos"
      ? "irmaos"
      : params?.tab === "convites" || params?.tab === "tokens"
        ? "convites"
        : "pessoas";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-5 py-10 sm:px-6 sm:py-16">
      <header className="space-y-2">
        <Skeleton className="h-10 w-48 sm:h-12" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </header>

      <div className="space-y-6">
        <div className="flex gap-1">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>

        {tab === "convites" ? (
          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border p-6">
              <Skeleton className="h-5 w-36" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
            <div className="space-y-3 rounded-2xl border p-6">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 3 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
                <TokenRowSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : tab === "irmaos" ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
              <MemberCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <Skeleton className="h-10 w-36 rounded-xl" />
            {Array.from({ length: 2 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
              <div key={index} className="space-y-3 rounded-2xl border p-6">
                <Skeleton className="h-5 w-32" />
                {Array.from({ length: 3 }).map((_, rowIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
                  <PeopleRowSkeleton key={rowIndex} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
