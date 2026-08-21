"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { WeekPicker } from "./week-picker";

export function ScheduleWeekNav({
  weekStartIso,
  weeks,
}: {
  weekStartIso: string;
  weeks: { title: string; date: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (iso: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("week", iso);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return <WeekPicker weekStartIso={weekStartIso} weeks={weeks} onChange={handleChange} />;
}
