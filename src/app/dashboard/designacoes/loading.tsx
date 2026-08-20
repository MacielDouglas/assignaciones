import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border p-16">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-72" />
      </div>
    </main>
  );
}
