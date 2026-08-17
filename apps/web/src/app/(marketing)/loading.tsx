import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Skeleton className="h-6 w-48 rounded-full" />
      <Skeleton className="h-12 w-full max-w-xl sm:h-16" />
      <Skeleton className="h-5 w-full max-w-md" />
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Skeleton className="h-10 w-full sm:w-40" />
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>
    </div>
  );
}
