"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useMembersTabs } from "@/components/members-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
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
  const tabs = useMembersTabs();
  const [members, setMembers] = useState(initialMembers);
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<{ member: MemberRow; role: MemberRole } | null>(
    null,
  );

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
      const previousRole = member.role;
      setMembers((current) =>
        current.map((item) => (item.id === member.id ? { ...item, role } : item)),
      );
      toast.success(`Papel alterado para ${ROLE_LABEL[role]}.`, {
        action: {
          label: "Desfazer",
          onClick: () => {
            const current = membersRef.current.find((item) => item.id === member.id);
            if (!current || current.role !== role) return;
            void apiFetch(`/api/organizations/${organizationId}/members/${member.id}`, {
              method: "PATCH",
              body: JSON.stringify({ role: previousRole }),
            }).catch(() => {
              toast.error("Não foi possível desfazer a alteração.");
            });
            setMembers((current) =>
              current.map((item) =>
                item.id === member.id ? { ...item, role: previousRole } : item,
              ),
            );
          },
        },
      });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  }

  const isSelf = (member: MemberRow) => member.user.id === currentUserId;
  const displayName = (member: MemberRow) => member.user.name ?? member.user.email ?? "Usuário";

  return (
    <div className="space-y-6">
      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm">Nenhum irmão com acesso ainda.</p>
            <Button variant="outline" onClick={() => tabs.setValue("convites")}>
              Convidar irmãos
            </Button>
          </CardContent>
        </Card>
      ) : (
        members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">
                  {displayName(member)}
                  {isSelf(member) && <span className="text-muted-foreground text-xs"> (você)</span>}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {member.person ? member.person.nome : "Sem pessoa vinculada"}
                  {member.user.email ? ` · ${member.user.email}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {allowedRoles.includes(member.role) ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => setPendingRole({ member, role: value as MemberRole })}
                    disabled={savingId === member.id}
                  >
                    <SelectTrigger
                      className="min-w-0 flex-1 sm:w-36 sm:flex-none"
                      aria-label={`Papel de ${displayName(member)}: ${ROLE_LABEL[member.role]}`}
                    >
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
                ) : (
                  <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={pendingRole !== null} onOpenChange={(open) => !open && setPendingRole(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Alterar o papel de {pendingRole ? displayName(pendingRole.member) : ""}?
            </DialogTitle>
            <DialogDescription>
              {pendingRole
                ? `${displayName(pendingRole.member)} passará de ${ROLE_LABEL[pendingRole.member.role]} para ${ROLE_LABEL[pendingRole.role]}. Isso muda o que ele pode ver e fazer no aplicativo.`
                : ""}
            </DialogDescription>
            {pendingRole &&
              pendingRole.member.user.id === currentUserId &&
              pendingRole.role !== MemberRole.OWNER && (
                <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-xs">
                  Você está mudando o seu próprio papel. Ao deixar de ser Proprietário, você não
                  poderá mais mudar papéis. Confirme se outro Proprietário ou Administrador pode
                  fazer isso.
                </p>
              )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRole(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!pendingRole) return;
                const { member, role } = pendingRole;
                setPendingRole(null);
                void changeRole(member, role);
              }}
            >
              Alterar papel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
