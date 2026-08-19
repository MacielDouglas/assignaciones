-- CreateTable
CREATE TABLE "Watchtower" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "languageCode" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchtower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchtowerArticle" (
    "id" TEXT NOT NULL,
    "watchtowerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dates" TEXT,
    "color" TEXT,
    "openingSong" INTEGER,
    "closingSong" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WatchtowerArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Watchtower_organizationId_symbol_key" ON "Watchtower"("organizationId", "symbol");

-- CreateIndex
CREATE INDEX "Watchtower_organizationId_idx" ON "Watchtower"("organizationId");

-- CreateIndex
CREATE INDEX "WatchtowerArticle_watchtowerId_idx" ON "WatchtowerArticle"("watchtowerId");

-- AddForeignKey
ALTER TABLE "Watchtower" ADD CONSTRAINT "Watchtower_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchtowerArticle" ADD CONSTRAINT "WatchtowerArticle_watchtowerId_fkey" FOREIGN KEY ("watchtowerId") REFERENCES "Watchtower"("id") ON DELETE CASCADE ON UPDATE CASCADE;