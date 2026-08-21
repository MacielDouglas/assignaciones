"use client";

import { Link2, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MemberRole, Sex } from "@/generated/prisma/enums";
import type { PersonPrivileges } from "./privileges-section";
import { PrivilegesSection } from "./privileges-section";
import { QualificationsSection } from "./qualifications-section";
import { RoleBadge } from "./role-badge";
import { RoleSelector } from "./role-selector";
import { type UserLink, UserLinkInfo } from "./user-link-info";

export interface PersonCardMember extends UserLink {
  memberId: string;
  role: MemberRole;
}

export interface PersonHistoryItem {
  weekStart: string;
  dateLabel: string;
  label: string;
  isMidweek: boolean;
}

export interface PersonCardData extends PersonPrivileges {
  id: string;
  nome: string;
  sexo: Sex | string;
  ativo: boolean;
  estudante: boolean;
  batizado: boolean;
  jovem: boolean;
  casado: boolean;
  chefeFamilia: boolean;
  /** Usuário vinculado (acesso ao sistema), quando existir. */
  member: PersonCardMember | null;
  /** Últimas partes designadas (mais recente primeiro). */
  history?: PersonHistoryItem[];
}

function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function personInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : nome.slice(0, 2);
}

const SEX_LABEL: Record<string, string> = { MALE: "Masculino", FEMALE: "Feminino" };

function PersonHistory({ history }: { history: PersonHistoryItem[] }) {
  if (history.length === 0) return null;
  const latest = history[0];
  const older = history.length - 1;
  return (
    <details className="group/history">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-xs [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1">
          Última parte: {latest.label} · {latest.dateLabel}
          {older > 0 && (
            <span className="text-muted-foreground/70 group-open/history:hidden">
              (+{older} anterior{older > 1 ? "es" : ""})
            </span>
          )}
        </span>
      </summary>
      <ul className="border-border/60 mt-1 space-y-0.5 border-l pl-3">
        {history.map((item, index) => (
          <li
            key={`${item.weekStart}-${item.label}-${index}`}
            className="text-muted-foreground text-xs"
          >
            {item.dateLabel}
            {" · "}
            {item.label}
            {item.isMidweek ? " · meio de semana" : " · fim de semana"}
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * Card completo da pessoa: identificação, qualificações, privilégios e o
 * rodapé "Usuário Vinculado" com o controle de função no sistema.
 * As regras de alteração de função são aplicadas no backend.
 */
export function PersonCard({
  person,
  organizationId,
  canEdit,
  actorIsOwner,
  currentUserId,
  onEdit,
  onDelete,
  onRoleChanged,
}: {
  person: PersonCardData;
  organizationId: string;
  canEdit: boolean;
  /** Ator é Owner: pode alterar qualquer função, inclusive promover Owners. */
  actorIsOwner: boolean;
  currentUserId: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onRoleChanged?: (role: MemberRole) => void;
}) {
  const member = person.member;
  const isSelfUser = member?.userId != null && member.userId === currentUserId;

  // Espelho das regras do backend (PATCH /members/:id). O backend continua
  // autoritativo; aqui apenas escondemos ações que seriam rejeitadas.
  const allowedRoles: MemberRole[] = (() => {
    if (!member || !canEdit) return [];
    if (actorIsOwner) return ["OWNER", "ADMIN", "MEMBER"];
    if (member.role === "OWNER") return []; // Admin não altera Owners
    return ["ADMIN", "MEMBER"]; // Admin promove/rebaixa admins e membros
  })();

  const showRoleSelector = canEdit && member !== null && allowedRoles.length > 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 shrink-0 border">
            <AvatarFallback
              style={{ backgroundColor: `hsl(${hueFromId(person.id)} 42% 46%)` }}
              className="text-sm font-semibold text-white"
            >
              {personInitials(person.nome)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate text-sm font-semibold" title={person.nome}>
                {person.nome}
                {isSelfUser && (
                  <span className="text-muted-foreground ml-1 text-xs font-normal">(você)</span>
                )}
              </p>
              <Badge
                variant="outline"
                className={
                  person.ativo
                    ? "border-success/40 bg-success/10 px-2 py-0 text-[11px] text-success"
                    : "text-muted-foreground px-2 py-0 text-[11px]"
                }
              >
                {person.ativo ? "Ativo" : "Inativo"}
              </Badge>
              {member && <RoleBadge role={member.role} />}
            </div>
            <p className="text-muted-foreground text-xs">
              {SEX_LABEL[person.sexo] ?? "—"}
              {person.chefeFamilia ? " · Chefe de família" : ""}
            </p>
          </div>

          {canEdit && (onEdit || onDelete) && (
            <div className="flex shrink-0 gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${person.nome}`}
                  onClick={onEdit}
                >
                  <Pencil />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${person.nome}`}
                  onClick={onDelete}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          )}
        </div>

        <QualificationsSection person={person} />
        <PrivilegesSection person={person} />
        <PersonHistory history={person.history ?? []} />

        <div className="border-border/60 space-y-2 border-t pt-3">
          <p className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase">
            <Link2 className="size-3" aria-hidden="true" />
            Usuário vinculado
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <UserLinkInfo member={member} />
            </div>
            {showRoleSelector && member && (
              <RoleSelector
                organizationId={organizationId}
                memberId={member.memberId}
                role={member.role}
                userName={member.name ?? person.nome}
                allowedRoles={allowedRoles}
                isSelf={isSelfUser}
                onRoleChanged={(next) => onRoleChanged?.(next)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
