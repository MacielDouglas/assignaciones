"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { MemberRole } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { ROLE_LABEL } from "../lib/person-labels";

/**
 * Seletor da função no sistema (Owner/Admin/Member). As regras de quem pode
 * alterar o quê são aplicadas exclusivamente no backend (PATCH /members/:id);
 * `allowedRoles` apenas espelha o que o ator pode ver.
 */
export function RoleSelector({
  organizationId,
  memberId,
  role,
  userName,
  allowedRoles,
  isSelf = false,
  disabled = false,
  onRoleChanged,
}: {
  organizationId: string;
  memberId: string;
  role: MemberRole;
  userName: string;
  allowedRoles: MemberRole[];
  isSelf?: boolean;
  disabled?: boolean;
  onRoleChanged: (role: MemberRole) => void;
}) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<MemberRole | null>(null);
  const [saving, setSaving] = useState(false);
  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  async function changeRole(next: MemberRole) {
    if (next === roleRef.current) return;
    setSaving(true);
    try {
      await apiFetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: next }),
      });
      const previousRole = roleRef.current;
      onRoleChanged(next);
      toast.success(`Função alterada para ${ROLE_LABEL[next]}.`, {
        action: {
          label: "Desfazer",
          onClick: () => {
            void apiFetch(`/api/organizations/${organizationId}/members/${memberId}`, {
              method: "PATCH",
              body: JSON.stringify({ role: previousRole }),
            })
              .then(() => onRoleChanged(previousRole))
              .catch(() => toast.error("Não foi possível desfazer a alteração."));
          },
        },
      });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Select
        value={role}
        onValueChange={(value) => setPendingRole(value as MemberRole)}
        disabled={disabled || saving || allowedRoles.length === 0}
      >
        <SelectTrigger
          className="h-8 w-36 text-xs"
          aria-label={`Função de ${userName}: ${ROLE_LABEL[role]}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedRoles.map((item) => (
            <SelectItem key={item} value={item}>
              {ROLE_LABEL[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={pendingRole !== null} onOpenChange={(open) => !open && setPendingRole(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Alterar a função de {userName}?</DialogTitle>
            <DialogDescription>
              {pendingRole
                ? `${userName} passará de ${ROLE_LABEL[role]} para ${ROLE_LABEL[pendingRole]}. Isso muda o que ele pode ver e fazer no aplicativo.`
                : ""}
            </DialogDescription>
            {isSelf && pendingRole !== null && pendingRole !== role && pendingRole !== "OWNER" && (
              <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs">
                Você está mudando a sua própria função. Ao deixar de ser Proprietário, você não
                poderá mais alterar funções. Confirme se outro Proprietário ou Administrador poderá
                fazer isso.
              </p>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingRole(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!pendingRole) return;
                const next = pendingRole;
                setPendingRole(null);
                void changeRole(next);
              }}
              disabled={saving}
            >
              Alterar função
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
