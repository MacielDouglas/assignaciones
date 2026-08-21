import { Crown, Shield, User } from "lucide-react";
import type { MemberRole } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "../lib/person-labels";

const ROLE_STYLES: Record<MemberRole, string> = {
  OWNER:
    "border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-400",
  ADMIN: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  MEMBER: "border-border bg-muted/60 text-muted-foreground",
};

const ROLE_ICONS: Record<MemberRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

export function RoleBadge({ role, className }: { role: MemberRole; className?: string }) {
  const Icon = ROLE_ICONS[role];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        ROLE_STYLES[role],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {ROLE_LABEL[role]}
    </span>
  );
}

export { ROLE_LABEL };
