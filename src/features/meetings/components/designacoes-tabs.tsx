"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DesignacoesTabs({
  reunioes,
  designacoes,
}: {
  reunioes: ReactNode;
  designacoes: ReactNode;
}) {
  return (
    <Tabs defaultValue="reunioes">
      <TabsList>
        <TabsTrigger value="reunioes">Reuniões</TabsTrigger>
        <TabsTrigger value="designacoes">Designações</TabsTrigger>
      </TabsList>
      <TabsContent value="reunioes">{reunioes}</TabsContent>
      <TabsContent value="designacoes">{designacoes}</TabsContent>
    </Tabs>
  );
}
