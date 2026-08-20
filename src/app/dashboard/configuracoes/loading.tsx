import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>

      <Skeleton className="h-10 w-48 rounded-full" />

      <div className="space-y-8">
        <section className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton estático, itens não reordenam
              <div key={index} className="space-y-4 rounded-2xl border px-5 py-5">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Skeleton className="h-5 w-44" />
          {Array.from({ length: 3 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton estático, itens não reordenam
            <div key={index} className="space-y-3 rounded-2xl border px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-3.5 w-72" />
                </div>
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton estático, itens não reordenam
              <div key={index} className="space-y-3 rounded-2xl border px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3.5 w-64" />
                  </div>
                  <Skeleton className="h-9 w-32 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
