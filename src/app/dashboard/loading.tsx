import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="space-y-3 border border-transparent p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-3 border border-transparent p-6">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <nav className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
          <div key={index} className="flex items-center gap-3 rounded-2xl border p-4">
            <Skeleton className="size-11 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-40" />
            </div>
          </div>
        ))}
      </nav>
    </main>
  );
}
