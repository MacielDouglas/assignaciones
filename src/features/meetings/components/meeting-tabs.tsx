"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type MeetingTabKey = "midweek" | "weekend";

/**
 * Abas da área de reuniões (Meio de Semana / Fim de Semana).
 * A aba ativa fica na URL (?tab=), mantendo o conteúdo server-rendered.
 */
export function MeetingTabs({
  defaultValue,
  basePath,
  midweek,
  weekend,
}: {
  defaultValue: MeetingTabKey;
  basePath: string;
  midweek: ReactNode;
  weekend: ReactNode;
}) {
  const router = useRouter();

  function selectTab(tab: string) {
    router.replace(`${basePath}?tab=${tab}`, { scroll: false });
  }

  return (
    <Tabs value={defaultValue} onValueChange={selectTab} className="space-y-3">
      <TabsList className="grid h-12 w-full grid-cols-2">
        <TabsTrigger value="midweek" className="h-10 data-[state=active]:shadow-sm">
          Meio de Semana
        </TabsTrigger>
        <TabsTrigger value="weekend" className="h-10 data-[state=active]:shadow-sm">
          Fim de Semana
        </TabsTrigger>
      </TabsList>
      <TabsContent value="midweek" className="space-y-4">
        {midweek}
      </TabsContent>
      <TabsContent value="weekend" className="space-y-4">
        {weekend}
      </TabsContent>
    </Tabs>
  );
}
