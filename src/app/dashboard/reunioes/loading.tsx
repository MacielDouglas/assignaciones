import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-6">
          <Skeleton className="h-8 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </header>

        <div className="flex flex-col items-center gap-4 rounded-2xl border px-4 py-12 text-center">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="mx-auto h-5 w-24" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-52 rounded-full" />
        </div>
      </div>
    </main>
  );
}
