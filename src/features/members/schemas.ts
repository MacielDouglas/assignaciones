import { z } from "zod";
import { MemberRole } from "@/generated/prisma/enums";

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(MemberRole),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
