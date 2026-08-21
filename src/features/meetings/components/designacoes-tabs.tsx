"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DesignacoesTab = "reunioes" | "designacoes";

export function DesignacoesTabs({
  defaultValue,
  reunioes,
  designacoes,
}: {
  defaultValue: DesignacoesTab;
  reunioes: ReactNode;
  designacoes: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectTab = useCallback(
    (tab: DesignacoesTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/dashboard/designacoes?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <Tabs
      value={defaultValue}
      onValueChange={(tab) => selectTab(tab as DesignacoesTab)}
      className="space-y-6"
    >
      <TabsList>
        <TabsTrigger value="reunioes">Reuniões</TabsTrigger>
        <TabsTrigger value="designacoes">Designações</TabsTrigger>
      </TabsList>
      <TabsContent value="reunioes">{reunioes}</TabsContent>
      <TabsContent value="designacoes">{designacoes}</TabsContent>
    </Tabs>
  );
}
