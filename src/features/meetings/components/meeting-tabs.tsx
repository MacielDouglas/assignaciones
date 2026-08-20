"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MeetingTabs({ midweek, weekend }: { midweek: ReactNode; weekend: ReactNode }) {
  return (
    <Tabs defaultValue="midweek">
      <TabsList>
        <TabsTrigger value="midweek">Meio de Semana</TabsTrigger>
        <TabsTrigger value="weekend">Fim de Semana</TabsTrigger>
      </TabsList>
      <TabsContent value="midweek" className="space-y-4 pt-4">
        {midweek}
      </TabsContent>
      <TabsContent value="weekend" className="space-y-4 pt-4">
        {weekend}
      </TabsContent>
    </Tabs>
  );
}
