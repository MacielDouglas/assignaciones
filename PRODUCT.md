# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

- **Gestores e líderes**: criam organizações, convidam membros, cadastram pessoas, criam tarefas e reuniões e designam responsáveis e participantes.
- **Membros da equipe**: recebem, executam e concluem as tarefas designadas; participam das reuniões designadas e acompanham o que precisa ser feito e por quem.
- **Sub-user**: administrador global que gera tokens de criação de organização e acompanha todas as organizações do sistema.

Confirmado: toda a equipe usa o produto — quem designa e quem recebe a designação são igualmente centrais.

## Product Purpose

Plataforma para **criar designações de tarefas e reuniões**. Permite criar organizações, distribuir responsabilidades e acompanhar o status de cada designação em tempo real, do início à conclusão. Sucesso é a equipe conectada: todos sabem o que precisa ser feito, em quais reuniões devem estar e por quem cada coisa foi designada, em qualquer dispositivo.

## Positioning

Unifica **tarefas e reuniões num único lugar** — é isso que diferencia o Asignaciones de um calendário ou gerenciador de tarefas isolado: designações claras de quem, para quê e quando, sem alternar entre ferramentas. O acesso é controlado por tokens de 8 caracteres: organizações nascem de um token distribuído pelo sub-user e novos membros entram por convite — não há cadastro aberto de organizações. Pessoas podem existir sem conta na plataforma, o que permite designar trabalho e reuniões a quem não é usuário.

## Operating Context

- Web mobile-first responsivo (370px → full HD) e apps nativos iOS/Android com as mesmas telas.
- Onboarding: criar organização com token (`ORGANIZATION_CREATE`) ou entrar com token de convite (`MEMBER_INVITE`); códigos de 8 caracteres alfanuméricos com expiração.
- Papéis por membro: OWNER, ADMIN, MEMBER. OWNER e ADMIN gerenciam pessoas e membros.
- Pessoas: nome obrigatório; e-mail e telefone opcionais; podem ter conta vinculada ou não.
- Sub-user gera tokens de criação de organização e enxerga todas as organizações.
- Autenticação social: Google (web + mobile) e Apple (iOS) via Better Auth; mobile usa deep link `asignaciones://`.
- Banco de dados PostgreSQL (Neon) com Prisma; deploy na Vercel (web) e EAS (mobile).

## Capabilities and Constraints

Implementadas hoje: organizações, membros com papéis, pessoas vinculadas a membros, tokens de criação/convite, sub-user, autenticação social e esquema de login com e-mail/senha.

**Tarefas e reuniões ainda não existem no schema** — o modelo de dados cobre só organização/membro/pessoa/token; o painel exibe estatísticas zeradas. O novo objetivo é designar tarefas e reuniões (criar e designar quem participa/responde); o design deve tratar tarefas e reuniões como as experiências principais, mesmo onde ainda não estão implementadas.

- Idioma do produto: português do Brasil.
- Validação Zod no back-end; tipos e schemas compartilhados em `packages/shared`.
- Monorepo Bun (web Next.js 16 / mobile Expo SDK 57); lint e formato com Biome.
- Web usa shadcn/ui + Tailwind v4; mobile usa componentes próprios em React Native.

## Brand Commitments

- Nome do produto: **Asignaciones** (mantido em espanhol, com copy em português do Brasil).
- Idioma de interface: português do Brasil.
- Tema claro/escuro suportado (web via next-themes; mobile com componentes temáticos).

## Evidence on Hand

- Código-fonte completo dos dois apps: `apps/web` (Next.js), `apps/mobile` (Expo), `packages/shared` (schemas Zod).
- Schema Prisma com os modelos Organization, OrganizationMember, Person e InviteToken.
- Página de marketing, fluxo de login social e onboarding por tokens já implementados.
- Nenhum testemunho, caso de cliente, benchmark, preço ou licença confirmado — não fabricar.

## Product Principles

1. **Toda a equipe é usuária**: quem designa e quem recebe a designação têm a mesma importância; a interface serve aos dois lados.
2. **Tarefas e reuniões são o produto**: criar e designar comandam as decisões; onboarding e tokens são meios, não fins.
3. **Uma experiência só para as duas coisas**: tarefas e reuniões unificadas num único fluxo, sem alternar ferramentas.
4. **Experiência adaptativa**: um produto só, com linguagem visual própria do web e dos apps nativos, sem espelhos mal resolvidos.
5. **Acesso controlado e distribuído**: organizações nascem de tokens, não de cadastro aberto.
6. **Simplicidade operacional**: começar e operar com o mínimo de fricção — tokens curtos, sem configuração prévia.

## Accessibility & Inclusion

- Responsividade mobile-first e suporte a tema claro/escuro são os requisitos conhecidos.
- Sem requisito de padrão de acessibilidade específico confirmado além disso.