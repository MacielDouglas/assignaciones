<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Estrutura por features (DDD)

O domínio e a UI vivem em `src/features/<feature>/`, com a feature nomeada por domínio (auth, dashboard, people, members, tokens, meetings):

- `components/` — componentes de página; `"use client"` apenas em managers, formulários e botões
- `lib/` — lógica de domínio (parsers, acesso a dados, regras da feature)
- `schemas.ts` — validação zod da feature; toda validação fica no back-end

`src/lib/` guarda somente infraestrutura compartilhada: `api`, `api-client`, `auth`, `auth-client`, `prisma`, `session`, `roles`, `organizations`, `utils`, `schemas` (apenas `tokenCode`). Componentes shadcn ficam exclusivamente em `src/components/ui/`.

Regras ao escrever código:

1. Páginas (`src/app/**/page.tsx`) são server components; nunca adicione `"use client"` a elas.
2. Toda página deve ter um `loading.tsx` ao lado, em server component, com skeleton espelhando o layout real da página (usar `Skeleton` de `@/components/ui/skeleton`, mesmas classes de container e proporções dos elementos).
3. Importe domínio e componentes apenas da própria feature (`@/features/<feature>/...`); infraestrutura vem de `@/lib/...`.
4. Validação sempre no back-end com zod no `schemas.ts` da feature; nunca confie só no cliente.
5. Supressão de lint de chave de array somente com comentário `// biome-ignore lint/suspicious/noArrayIndexKey: ...`.
6. Antes de entregar, rode `bun run format`, `bun run lint`, `bun run typecheck` e `bun run build`.
