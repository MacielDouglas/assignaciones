import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-2 text-center">
          <Skeleton className="mx-auto h-7 w-56" />
          <Skeleton className="mx-auto h-4 w-44" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="mx-auto h-3 w-64" />
        </CardContent>
      </Card>
    </main>
  );
}
