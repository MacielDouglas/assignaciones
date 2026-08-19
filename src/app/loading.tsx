import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-4 text-center">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="mx-auto h-7 w-36" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="mx-auto h-3 w-56" />
        </div>
      </div>
    </main>
  );
}
