import type { MemberRole } from "@/generated/prisma/enums";

/** Rótulos dos campos do formulário de pessoa (checkboxes dos grupos e badges). */
export const PRIVILEGE_LABEL: Record<string, string> = {
  // Cargos e privilégios (reunião de meio de semana)
  anciao: "Ancião",
  oQueVoceDiria: "'O que você diria?'",
  presidenteNossaVida: "Presidente de 'Nossa Vida Cristã'",
  discursoTesouros: "Discurso de tesouros",
  joiasEspirituais: "Joias espirituais",
  partesNossaVidaCrista: "Partes de 'Nossa Vida Cristã'",
  estudoBiblicoCongregacao: "Estudo bíblico de congregação",
  leitorEstudoBiblico: "Leitor do estudo bíblico",

  // Reunião pública
  presidenteReuniaoPublica: "Presidente da reunião pública",
  discursoPublico: "Discurso público",
  dirigenteEstudoSentinela: "Dirigente do estudo de Sentinela",
  leitorEstudoSentinela: "Leitor do estudo de Sentinela",

  // Estudante
  iniciandoConversa: "Iniciando conversas",
  cultivandoInteresse: "Cultivando interesse",
  fazendoDiscipulos: "Fazendo discípulos",
  explicandoCrencas: "Explicando crenças",

  // Homem · estudante
  discursoFacaseuMelhor: "'Faça o seu melhor'",
  leituraBiblia: "Leitura da Bíblia",

  // Homem · batizado
  privilegiosServico: "Privilégios de serviço",
  oracao: "Oração",
};

export const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
};
