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

export const sexSchema = z.enum(["MALE", "FEMALE"]);
export type Sex = z.infer<typeof sexSchema>;

export const sexLabels: Record<Sex, string> = {
  MALE: "Masculino",
  FEMALE: "Feminino",
};

const optionalFamilySchema = z
  .string()
  .trim()
  .min(1, "A família deve ter pelo menos 1 caractere")
  .max(80, "A família deve ter no máximo 80 caracteres")
  .optional()
  .transform((value) => (value ? value : undefined));

const booleanField = (fallback: boolean) => z.boolean().default(fallback);

const personFieldsShape = {
  name: personNameSchema,
  sex: sexSchema,
  family: optionalFamilySchema,
  isHeadOfFamily: booleanField(false),
  isYoung: booleanField(false),
  isStudent: booleanField(true),
  isBaptized: booleanField(true),
  isActive: booleanField(true),
  hasCleaning: booleanField(true),
  startingConversation: booleanField(false),
  cultivatingInterest: booleanField(false),
  makingDisciples: booleanField(false),
  explainingBeliefs: booleanField(false),
  hasBestMinistrySpeech: booleanField(false),
  hasBibleReading: booleanField(true),
  hasServicePrivileges: booleanField(false),
  hasPrayer: booleanField(false),
  isElder: booleanField(false),
  hasWhatWouldYouSay: booleanField(false),
  hasNVMCChairman: booleanField(false),
  hasTreasuresSpeech: booleanField(false),
  hasSpiritualGems: booleanField(false),
  hasChristianLifeParts: booleanField(false),
  hasCongregationBibleStudy: booleanField(false),
  isBibleStudyReader: booleanField(false),
  hasPublicMeetingChairman: booleanField(false),
  hasPublicTalk: booleanField(false),
  hasWatchtowerStudyConductor: booleanField(false),
  isWatchtowerStudyReader: booleanField(false),
};

function normalizePersonFields<T extends Record<string, unknown>>(data: T): T {
  const isMale = data.sex === "MALE";
  const isMaleStudent = isMale && data.isStudent === true;
  const isMaleBaptized = isMale && data.isBaptized === true;
  const hasPrivileges = isMaleBaptized && data.hasServicePrivileges === true;

  return {
    ...data,
    startingConversation: data.isStudent === true && data.startingConversation === true,
    cultivatingInterest: data.isStudent === true && data.cultivatingInterest === true,
    makingDisciples: data.isStudent === true && data.makingDisciples === true,
    explainingBeliefs: data.isStudent === true && data.explainingBeliefs === true,
    hasBestMinistrySpeech: isMaleStudent && data.hasBestMinistrySpeech === true,
    hasBibleReading: isMaleStudent && data.hasBibleReading === true,
    hasServicePrivileges: isMaleBaptized && data.hasServicePrivileges === true,
    hasPrayer: isMaleBaptized && data.hasPrayer === true,
    isElder: hasPrivileges && data.isElder === true,
    hasWhatWouldYouSay: hasPrivileges && data.hasWhatWouldYouSay === true,
    hasNVMCChairman: hasPrivileges && data.hasNVMCChairman === true,
    hasTreasuresSpeech: hasPrivileges && data.hasTreasuresSpeech === true,
    hasSpiritualGems: hasPrivileges && data.hasSpiritualGems === true,
    hasChristianLifeParts: hasPrivileges && data.hasChristianLifeParts === true,
    hasCongregationBibleStudy: hasPrivileges && data.hasCongregationBibleStudy === true,
    isBibleStudyReader: hasPrivileges && data.isBibleStudyReader === true,
    hasPublicMeetingChairman: hasPrivileges && data.hasPublicMeetingChairman === true,
    hasPublicTalk: hasPrivileges && data.hasPublicTalk === true,
    hasWatchtowerStudyConductor: hasPrivileges && data.hasWatchtowerStudyConductor === true,
    isWatchtowerStudyReader: hasPrivileges && data.isWatchtowerStudyReader === true,
  };
}

export const personFieldsSchema = z.object(personFieldsShape).transform(normalizePersonFields);
export type PersonFields = z.infer<typeof personFieldsSchema>;

export const redeemOrganizationCreateInput = z.object({
  code: tokenCodeSchema,
  name: organizationNameSchema,
});

export const redeemMemberInviteInput = z.object({
  code: tokenCodeSchema,
});

export const createPersonInput = z
  .object({
    organizationId: z.string().min(1, "Organização inválida"),
    ...personFieldsShape,
  })
  .transform(normalizePersonFields);

export const updatePersonInput = z
  .object({
    organizationId: z.string().min(1, "Organização inválida"),
    personId: z.string().min(1, "Pessoa inválida"),
    ...personFieldsShape,
  })
  .transform(normalizePersonFields);

export const deletePersonInput = z.object({
  organizationId: z.string().min(1, "Organização inválida"),
  personId: z.string().min(1, "Pessoa inválida"),
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
export type UpdatePersonInput = z.infer<typeof updatePersonInput>;
export type DeletePersonInput = z.infer<typeof deletePersonInput>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleInput>;
export type LinkPersonToMemberInput = z.infer<typeof linkPersonToMemberInput>;
export type UnlinkPersonInput = z.infer<typeof unlinkPersonInput>;
export type PersonFieldKey = keyof typeof personFieldsShape;
