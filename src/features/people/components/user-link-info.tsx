import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserLink {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  /** Rótulo da data de vínculo (ex.: "desde 12/03/2026"), quando existir. */
  sinceLabel?: string | null;
}

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase();
}

/**
 * Rodapé do card de pessoa: mostra o usuário vinculado (ou estado neutro),
 * visualmente separado das informações da pessoa.
 */
export function UserLinkInfo({ member }: { member: UserLink | null }) {
  if (!member) {
    return (
      <div className="border-border/60 bg-muted/40 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2">
        <span
          aria-hidden="true"
          className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <UserRound className="size-4" />
        </span>
        <p className="text-muted-foreground text-xs font-medium">Nenhum usuário vinculado</p>
      </div>
    );
  }

  const label = member.name ?? member.email ?? "Usuário";

  return (
    <div className="border-border/60 bg-muted/40 flex items-center gap-2.5 rounded-xl border px-3 py-2">
      <Avatar className="size-8 shrink-0">
        {member.image ? <AvatarImage src={member.image} alt="" /> : null}
        <AvatarFallback className="text-[11px] font-semibold">
          {initials(member.name, member.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-xs font-semibold">{label}</p>
        <p className="text-muted-foreground truncate text-[11px]">
          {member.email ?? "Sem e-mail"}
          {member.sinceLabel ? ` · ${member.sinceLabel}` : ""}
        </p>
      </div>
    </div>
  );
}
