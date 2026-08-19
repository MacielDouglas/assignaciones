import { normalizePersonFields, resolveMarriage } from "@/features/people/lib/person-rules";
import type { Sex } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface PersonData {
  nome: string;
  sexo: Sex;
  chefeFamilia?: boolean;
  familiaId: string;
  jovem?: boolean;
  estudante?: boolean;
  batizado?: boolean;
  ativo?: boolean;
  limpeza?: boolean;
  casado?: boolean;
  iniciandoConversa?: boolean;
  cultivandoInteresse?: boolean;
  fazendoDiscipulos?: boolean;
  explicandoCrencas?: boolean;
  discursoFacaseuMelhor?: boolean;
  leituraBiblia?: boolean;
  privilegiosServico?: boolean;
  oracao?: boolean;
  anciao?: boolean;
  oQueVoceDiria?: boolean;
  presidenteNossaVida?: boolean;
  discursoTesouros?: boolean;
  joiasEspirituais?: boolean;
  partesNossaVidaCrista?: boolean;
  estudoBiblicoCongregacao?: boolean;
  leitorEstudoBiblico?: boolean;
  presidenteReuniaoPublica?: boolean;
  discursoPublico?: boolean;
  dirigenteEstudoSentinela?: boolean;
  leitorEstudoSentinela?: boolean;
}

async function familyBelongsTo(familiaId: string, organizationId: string) {
  return prisma.family.findFirst({
    where: { id: familiaId, organizationId },
    include: {
      persons: { select: { id: true, sexo: true, casado: true, spouseId: true } },
    },
  });
}

export async function createPerson(organizationId: string, data: PersonData) {
  const family = await familyBelongsTo(data.familiaId, organizationId);
  if (!family) return { error: "Família não encontrada nesta organização." };

  const normalized = normalizePersonFields({
    ...data,
    organizationId,
  });

  const marriage = resolveMarriage(
    { id: null, sexo: normalized.sexo, casado: normalized.casado ?? false, spouseId: null },
    family.persons,
  );
  if (marriage.error) return { error: marriage.error };

  const person = await prisma.person.create({
    data: {
      nome: normalized.nome,
      sexo: normalized.sexo,
      chefeFamilia: normalized.chefeFamilia ?? false,
      familiaId: normalized.familiaId,
      organizationId,
      jovem: normalized.jovem ?? false,
      estudante: normalized.estudante ?? true,
      batizado: normalized.batizado ?? false,
      ativo: normalized.ativo ?? true,
      limpeza: normalized.limpeza ?? true,
      casado: normalized.casado ?? false,
      iniciandoConversa: normalized.iniciandoConversa ?? false,
      cultivandoInteresse: normalized.cultivandoInteresse ?? false,
      fazendoDiscipulos: normalized.fazendoDiscipulos ?? false,
      explicandoCrencas: normalized.explicandoCrencas ?? false,
      discursoFacaseuMelhor: normalized.discursoFacaseuMelhor ?? false,
      leituraBiblia: normalized.leituraBiblia ?? true,
      privilegiosServico: normalized.privilegiosServico ?? false,
      oracao: normalized.oracao ?? false,
      anciao: normalized.anciao ?? false,
      oQueVoceDiria: normalized.oQueVoceDiria ?? false,
      presidenteNossaVida: normalized.presidenteNossaVida ?? false,
      discursoTesouros: normalized.discursoTesouros ?? false,
      joiasEspirituais: normalized.joiasEspirituais ?? false,
      partesNossaVidaCrista: normalized.partesNossaVidaCrista ?? false,
      estudoBiblicoCongregacao: normalized.estudoBiblicoCongregacao ?? false,
      leitorEstudoBiblico: normalized.leitorEstudoBiblico ?? false,
      presidenteReuniaoPublica: normalized.presidenteReuniaoPublica ?? false,
      discursoPublico: normalized.discursoPublico ?? false,
      dirigenteEstudoSentinela: normalized.dirigenteEstudoSentinela ?? false,
      leitorEstudoSentinela: normalized.leitorEstudoSentinela ?? false,
      spouseId: marriage.spouseId,
    },
  });

  return { person };
}

export async function updatePerson(
  personId: string,
  organizationId: string,
  data: Partial<PersonData>,
) {
  const existing = await prisma.person.findFirst({
    where: { id: personId, organizationId },
  });
  if (!existing) return { error: "Pessoa não encontrada." };

  const merged = {
    ...existing,
    ...data,
    familiaId: data.familiaId ?? existing.familiaId,
    organizationId,
  };

  const family = await familyBelongsTo(merged.familiaId, organizationId);
  if (!family) return { error: "Família não encontrada nesta organização." };

  const normalized = normalizePersonFields(merged);

  const marriage = resolveMarriage(
    {
      id: existing.id,
      sexo: normalized.sexo,
      casado: normalized.casado,
      spouseId: existing.spouseId,
    },
    family.persons,
  );
  if (marriage.error) return { error: marriage.error };

  if (marriage.linked || !normalized.casado) {
    await prisma.person.updateMany({
      where: { spouseId: existing.id },
      data: { spouseId: null },
    });
  }

  const person = await prisma.person.update({
    where: { id: existing.id },
    data: {
      nome: normalized.nome,
      sexo: normalized.sexo,
      chefeFamilia: normalized.chefeFamilia ?? false,
      familiaId: normalized.familiaId,
      jovem: normalized.jovem ?? false,
      estudante: normalized.estudante ?? true,
      batizado: normalized.batizado ?? false,
      ativo: normalized.ativo ?? true,
      limpeza: normalized.limpeza ?? true,
      casado: normalized.casado ?? false,
      iniciandoConversa: normalized.iniciandoConversa ?? false,
      cultivandoInteresse: normalized.cultivandoInteresse ?? false,
      fazendoDiscipulos: normalized.fazendoDiscipulos ?? false,
      explicandoCrencas: normalized.explicandoCrencas ?? false,
      discursoFacaseuMelhor: normalized.discursoFacaseuMelhor ?? false,
      leituraBiblia: normalized.leituraBiblia ?? true,
      privilegiosServico: normalized.privilegiosServico ?? false,
      oracao: normalized.oracao ?? false,
      anciao: normalized.anciao ?? false,
      oQueVoceDiria: normalized.oQueVoceDiria ?? false,
      presidenteNossaVida: normalized.presidenteNossaVida ?? false,
      discursoTesouros: normalized.discursoTesouros ?? false,
      joiasEspirituais: normalized.joiasEspirituais ?? false,
      partesNossaVidaCrista: normalized.partesNossaVidaCrista ?? false,
      estudoBiblicoCongregacao: normalized.estudoBiblicoCongregacao ?? false,
      leitorEstudoBiblico: normalized.leitorEstudoBiblico ?? false,
      presidenteReuniaoPublica: normalized.presidenteReuniaoPublica ?? false,
      discursoPublico: normalized.discursoPublico ?? false,
      dirigenteEstudoSentinela: normalized.dirigenteEstudoSentinela ?? false,
      leitorEstudoSentinela: normalized.leitorEstudoSentinela ?? false,
      spouseId: marriage.spouseId,
    },
  });

  return { person };
}

export async function deletePerson(personId: string, organizationId: string) {
  const existing = await prisma.person.findFirst({
    where: { id: personId, organizationId },
    include: { member: { select: { id: true } } },
  });
  if (!existing) return { error: "Pessoa não encontrada." };
  if (existing.member) {
    return { error: "Não é possível excluir a pessoa de um usuário cadastrado." };
  }

  await prisma.person.updateMany({
    where: { spouseId: existing.id },
    data: { spouseId: null },
  });

  await prisma.person.delete({ where: { id: existing.id } });

  return { deleted: true };
}
