"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MembersTabs({
  defaultValue,
  tokens,
  usuarios,
  pessoas,
}: {
  defaultValue: "tokens" | "usuarios" | "pessoas";
  tokens: ReactNode;
  usuarios: ReactNode;
  pessoas: ReactNode;
}) {
  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
        <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
      </TabsList>
      <TabsContent value="tokens">{tokens}</TabsContent>
      <TabsContent value="usuarios">{usuarios}</TabsContent>
      <TabsContent value="pessoas">{pessoas}</TabsContent>
    </Tabs>
  );
}
