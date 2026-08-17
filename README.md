# Asignaciones

Plataforma de atribuições de tarefas e gestão de equipe.

Monorepo com **Bun** contendo:

- `apps/web` — Web app [Next.js 16](https://nextjs.org) (App Router, mobile-first responsivo, 370px → full HD)
- `apps/mobile` — App mobile [Expo SDK 57](https://expo.dev) (React Native, Android + iOS)
- `packages/shared` — Schemas [Zod](https://zod.dev) e tipos compartilhados entre web e mobile

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework web | Next.js 16 (Turbopack, Server Components) |
| Framework mobile | Expo / React Native (Expo Router) |
| UI web | [shadcn/ui](https://ui.shadcn.com) (preset Nova, Radix) + Tailwind CSS v4 |
| UI mobile | Componentes próprios em React Native |
| Lint/Format | [Biome](https://biomejs.dev) |
| Banco de dados | PostgreSQL no [Neon](https://neon.tech) |
| ORM | Prisma |
| Validação | Zod (validada no back-end) |
| Autenticação | [Better Auth](https://better-auth.com) — login social Google (web + mobile) e Apple (iOS) |
| Deploy | Vercel (web) / EAS (mobile) |

## Estrutura

```
apps/
  web/          Next.js — src/app (rotas) + src/features (DDD) + src/components
  mobile/       Expo — src/app (rotas) + src/features + src/components + src/lib
packages/
  shared/       Schemas Zod e tipos compartilhados
```

## Requisitos

- [Bun](https://bun.sh) >= 1.3
- Node.js >= 20

## Configuração

### 1. Instalar dependências

```bash
bun install
```

### 2. Configurar variáveis de ambiente

Copie os exemplos e preencha os valores:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

- **DATABASE_URL** — connection string do projeto no [Neon](https://console.neon.tech)
- **BETTER_AUTH_SECRET** — gere com `openssl rand -base64 32`
- **GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET** — OAuth 2.0 Web Application no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **APPLE_CLIENT_ID / APPLE_CLIENT_SECRET** — Services ID + secret JWT no [Apple Developer](https://developer.apple.com/account/resources/authkeys)

### 3. Banco de dados

```bash
bun run db:generate   # gera o Prisma Client
bun run db:push       # aplica o schema no banco (Neon)
```

### 4. Rodar em desenvolvimento

```bash
bun run dev            # web em http://localhost:3000
bun run dev:mobile     # mobile (Expo)
```

No mobile, ajuste `EXPO_PUBLIC_API_URL` para o IP da sua máquina na rede local ao testar em dispositivo físico.

## Scripts

| Comando | Descrição |
| --- | --- |
| `bun run dev` | Inicia o web app |
| `bun run dev:mobile` | Inicia o app mobile |
| `bun run build` | Build de produção do web |
| `bun run lint` | Biome check em todo o monorepo |
| `bun run lint:fix` | Biome check com correções |
| `bun run format` | Biome format |
| `bun run db:generate` | Prisma generate |
| `bun run db:push` | Prisma db push |
| `bun run db:studio` | Prisma Studio |

## Deploy

### Web (Vercel)

1. Importe o repositório em [vercel.com/new](https://vercel.com/new)
2. O `vercel.json` já configura o monorepo (root `apps/web`, install com Bun)
3. Defina as variáveis de ambiente no painel (mesmas do `.env`)
4. Deploy

### Mobile (EAS)

```bash
cd apps/mobile
bunx eas init
bunx eas build --platform android  # ou --platform ios
```

## Autenticação

- **Web**: login social com Google e Apple via Better Auth (`/api/auth/[...all]`)
- **Mobile**: mesmo back-end, usando o plugin `@better-auth/expo` com deep link `asignaciones://`
- Rotas protegidas: web usa `src/proxy.ts`; mobile usa layout protegido em `src/app/(app)`