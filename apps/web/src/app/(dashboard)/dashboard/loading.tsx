import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["atribuicoes", "pendentes", "concluidas"].map((item) => (
          <div
            key={item}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:p-6"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </section>
    </div>
  );
}
