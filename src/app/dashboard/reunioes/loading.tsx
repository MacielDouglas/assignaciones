import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton da página de reuniões, espelhando o layout real: faixa azul
 * superior, faixa de identificação da reunião e seções coloridas com linhas.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1">
      <header className="bg-primary px-4 pt-3 pb-5 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="size-11 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-48 bg-white/25" />
          <Skeleton className="size-11 rounded-full bg-white/20" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-40 bg-white/20" />
          <Skeleton className="size-8 rounded-full bg-white/20" />
        </div>
      </header>

      <div className="mx-auto w-full space-y-4 px-4 pt-4 sm:px-6 sm:pb-16">
        <div className="bg-card flex items-center gap-2.5 rounded-2xl border p-3 shadow-xs">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
              <Skeleton key={index} className="size-2 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>

        <div className="space-y-2.5">
          {[0, 1, 2].map((section) => (
            <div key={section} className="rounded-2xl border p-0">
              <div className="flex items-center gap-3 p-3">
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="ml-auto h-6 w-16 rounded-full" />
              </div>
              <div className="divide-y bg-white/60 pt-2">
                {Array.from({ length: 3 }).map((_, row) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, items never reorder
                  <div key={row} className="flex items-center gap-2.5 px-3 py-2.5">
                    <Skeleton className="h-9 w-14 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="size-5 shrink-0 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
