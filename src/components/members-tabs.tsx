"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type MembersTab = "pessoas" | "convites";

const MembersTabsContext = createContext<{ setValue: (tab: MembersTab) => void } | null>(null);

export function useMembersTabs() {
  const context = useContext(MembersTabsContext);
  if (!context) throw new Error("useMembersTabs deve ser usado dentro de MembersTabs.");
  return context;
}

export function MembersTabs({
  defaultValue,
  convites,
  pessoas,
}: {
  defaultValue: MembersTab;
  convites: ReactNode;
  pessoas: ReactNode;
}) {
  const router = useRouter();
  const [value, setValue] = useState<MembersTab>(defaultValue);

  function selectTab(tab: MembersTab) {
    setValue(tab);
    router.replace(`/dashboard/membros?tab=${tab}`);
  }

  return (
    <MembersTabsContext.Provider value={{ setValue: selectTab }}>
      <Tabs
        value={value}
        onValueChange={(tab) => selectTab(tab as MembersTab)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          <TabsTrigger value="convites">Convites</TabsTrigger>
        </TabsList>
        <TabsContent value="pessoas">{pessoas}</TabsContent>
        <TabsContent value="convites" forceMount>
          {convites}
        </TabsContent>
      </Tabs>
    </MembersTabsContext.Provider>
  );
}
