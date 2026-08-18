# Asignaciones

Gestão de designações e membros da congregação. Web mobile-first com login social (Google).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, React Compiler, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Better Auth](https://www.better-auth.com) (login social Google)
- [Prisma 7](https://www.prisma.io) (PostgreSQL)
- [Zod](https://zod.dev)
- [Bun](https://bun.sh) + [Biome](https://biomejs.dev) (lint/formatter, format on save)

## Começando

```bash
bun install
bun run db:push   # sincroniza o schema no banco (usa DATABASE_URL do .env)
bun run dev
```

## Scripts

| Comando            | Descrição                              |
| ------------------ | -------------------------------------- |
| `bun run dev`      | Servidor de desenvolvimento            |
| `bun run build`    | Build de produção                      |
| `bun run check`    | Biome check + typecheck                |
| `bun run db:push`  | Sincroniza o schema no banco           |
| `bun run db:studio`| Prisma Studio                          |

## Estrutura

```
prisma/schema.prisma        Schema do banco
src/
  app/
    page.tsx                Boas-vindas + login Google
    dashboard/page.tsx      Painel pós-login
    api/auth/[...all]       Rotas do Better Auth
  components/               UI (shadcn) e componentes de feature
  lib/                      auth, db, utils
  proxy.ts                  Proteção de rotas autenticadas
```

## Variáveis de ambiente

Copie o `.env.example` para `.env` e preencha. O `.env` nunca é versionado.
