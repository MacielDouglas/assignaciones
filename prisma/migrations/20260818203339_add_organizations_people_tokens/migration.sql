-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InviteTokenType" AS ENUM ('ORGANIZATION_CREATE', 'MEMBER_INVITE');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "personId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sexo" "Sex" NOT NULL DEFAULT 'MALE',
    "chefeFamilia" BOOLEAN NOT NULL DEFAULT false,
    "familiaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jovem" BOOLEAN NOT NULL DEFAULT false,
    "estudante" BOOLEAN NOT NULL DEFAULT true,
    "batizado" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "limpeza" BOOLEAN NOT NULL DEFAULT true,
    "casado" BOOLEAN NOT NULL DEFAULT false,
    "spouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iniciandoConversa" BOOLEAN NOT NULL DEFAULT false,
    "cultivandoInteresse" BOOLEAN NOT NULL DEFAULT false,
    "fazendoDiscipulos" BOOLEAN NOT NULL DEFAULT false,
    "explicandoCrencas" BOOLEAN NOT NULL DEFAULT false,
    "discursoFacaseuMelhor" BOOLEAN NOT NULL DEFAULT false,
    "leituraBiblia" BOOLEAN NOT NULL DEFAULT true,
    "privilegiosServico" BOOLEAN NOT NULL DEFAULT false,
    "oracao" BOOLEAN NOT NULL DEFAULT false,
    "anciao" BOOLEAN NOT NULL DEFAULT false,
    "oQueVoceDiria" BOOLEAN NOT NULL DEFAULT false,
    "presidenteNossaVida" BOOLEAN NOT NULL DEFAULT false,
    "discursoTesouros" BOOLEAN NOT NULL DEFAULT false,
    "joiasEspirituais" BOOLEAN NOT NULL DEFAULT false,
    "partesNossaVidaCrista" BOOLEAN NOT NULL DEFAULT false,
    "estudoBiblicoCongregacao" BOOLEAN NOT NULL DEFAULT false,
    "leitorEstudoBiblico" BOOLEAN NOT NULL DEFAULT false,
    "presidenteReuniaoPublica" BOOLEAN NOT NULL DEFAULT false,
    "discursoPublico" BOOLEAN NOT NULL DEFAULT false,
    "dirigenteEstudoSentinela" BOOLEAN NOT NULL DEFAULT false,
    "leitorEstudoSentinela" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "type" "InviteTokenType" NOT NULL,
    "organizationId" TEXT,
    "createdById" TEXT NOT NULL,
    "personId" TEXT,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_key" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_personId_key" ON "OrganizationMember"("personId");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "Family_organizationId_idx" ON "Family"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_organizationId_name_key" ON "Family"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_spouseId_key" ON "Person"("spouseId");

-- CreateIndex
CREATE INDEX "Person_familiaId_idx" ON "Person"("familiaId");

-- CreateIndex
CREATE INDEX "Person_organizationId_idx" ON "Person"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_codeHash_key" ON "InviteToken"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_personId_key" ON "InviteToken"("personId");

-- CreateIndex
CREATE INDEX "InviteToken_organizationId_idx" ON "InviteToken"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_spouseId_fkey" FOREIGN KEY ("spouseId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
