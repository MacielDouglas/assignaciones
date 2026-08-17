import { z } from "zod";

export const memberRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const memberRoleLabels: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const tokenCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{8}$/, "O token deve ter exatamente 8 caracteres alfanuméricos");

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres")
  .max(80, "O nome deve ter no máximo 80 caracteres");

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres")
  .max(120, "O nome deve ter no máximo 120 caracteres");

const optionalEmailSchema = z
  .union([z.literal(""), z.string().trim().email("E-mail inválido").max(254, "E-mail muito longo")])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(20, "O telefone deve ter no máximo 20 caracteres")
  .optional()
  .transform((value) => (value ? value : undefined));

export const redeemOrganizationCreateInput = z.object({
  code: tokenCodeSchema,
  name: organizationNameSchema,
});

export const redeemMemberInviteInput = z.object({
  code: tokenCodeSchema,
});

export const createPersonInput = z.object({
  organizationId: z.string().min(1, "Organização inválida"),
  name: personNameSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
});

export const updateMemberRoleInput = z.object({
  memberId: z.string().min(1, "Membro inválido"),
  role: memberRoleSchema,
});

export const linkPersonToMemberInput = z.object({
  memberId: z.string().min(1, "Membro inválido"),
  personId: z.string().min(1, "Pessoa inválida"),
});

export const unlinkPersonInput = z.object({
  memberId: z.string().min(1, "Membro inválido"),
});

export type RedeemOrganizationCreateInput = z.infer<typeof redeemOrganizationCreateInput>;
export type RedeemMemberInviteInput = z.infer<typeof redeemMemberInviteInput>;
export type CreatePersonInput = z.infer<typeof createPersonInput>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleInput>;
export type LinkPersonToMemberInput = z.infer<typeof linkPersonToMemberInput>;
export type UnlinkPersonInput = z.infer<typeof unlinkPersonInput>;
