"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberRole } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export interface MemberRow {
  id: string;
  role: MemberRole;
  user: { id: string; name: string | null; email: string | null; image: string | null };
  person: { id: string; nome: string; sexo: string } | null;
}

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export function MembersManager({
  organizationId,
  actorRole,
  currentUserId,
  initialMembers,
}: {
  organizationId: string;
  actorRole: MemberRole;
  currentUserId: string;
  initialMembers: MemberRow[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isOwner = actorRole === MemberRole.OWNER;
  const allowedRoles: MemberRole[] = isOwner
    ? [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]
    : [MemberRole.ADMIN, MemberRole.MEMBER];

  async function changeRole(member: MemberRow, role: MemberRole) {
    if (member.role === role) return;
    setSavingId(member.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      toast.success("Papel atualizado.");
      router.refresh();
      setMembers((current) =>
        current.map((item) => (item.id === member.id ? { ...item, role } : item)),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  }

  const isSelf = (member: MemberRow) => member.user.id === currentUserId;

  return (
    <div className="space-y-2">
      {members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm">Nenhum membro ainda.</p>
          </CardContent>
        </Card>
      ) : (
        members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">
                  {member.user.name ?? member.user.email ?? "Usuário"}
                  {isSelf(member) && <span className="text-muted-foreground text-xs"> (você)</span>}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {member.person ? member.person.nome : "Sem pessoa vinculada"}
                  {member.user.email ? ` · ${member.user.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
                <Select
                  value={member.role}
                  onValueChange={(value) => changeRole(member, value as MemberRole)}
                  disabled={savingId === member.id}
                >
                  <SelectTrigger className="min-w-0 flex-1 sm:w-32 sm:flex-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
