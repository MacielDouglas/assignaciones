# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Irmãos da congregação (anciãos, secretário, servos ministeriais) que organizam as designações da reunião. Usam o app principalmente no celular, em contexto de serviço/ministério, e em sua maioria não são técnicos — a interface precisa ser simples, clara e rápida.

## Product Purpose

O app organiza e distribui as designações da reunião de meio de semana e fins de semana da congregação, substituindo planilhas, papéis e listas manuais. Sucesso = o responsável monta a escala em minutos e todos os irmãos enxergam suas designações sem confusão.

## Positioning

Escala de designações construída para o fluxo real da congregação: quem designa controla tudo (membros, restrições, avisos), quem é designado apenas consulta — sem ruído nem logística de planilha.

## Operating Context

- Uso predominante mobile (mobile-first), em telas de celular.
- Login social com Google (único método de autenticação).
- Acesso compartilhado por membros com papéis e permissões distintos (quem designa vs. quem consulta).
- Idioma: português do Brasil (textos, datas e convenções).

## Capabilities and Constraints

- Autenticação social Google via Better Auth (sem senha).
- Cadastro de membros e pessoas da congregação com atributos relevantes para a escala (família, estado civil de batizado/estudante, disponibilidade).
- Montagem e distribuição das designações das reuniões.
- Controle de acesso por papéis (admin/quem designa vs. membro/quem consulta).
- Integração com o banco PostgreSQL atual (Neon) via Prisma 7.
- O domínio herdado do app anterior (organizações, tokens de convite, sub-user global) será redefinido durante a evolução do produto; nada foi descartado nem confirmado formalmente.
- Dados antigos (organizações, pessoas, membros, tokens) foram removidos do banco em 18/08/2026, conforme decisão de recomeço.
- Importação de publicações oficiais em .jwpub como fonte da programação: apostila (mwb), A Sentinela, cânticos (sjj) e discursos públicos (S-34), por organização.
- Programação semanal gerada automaticamente a partir da apostila (Tesouros, Ministério, Nossa Vida Cristã; discurso público + estudo de A Sentinela no fim de semana), com designações salvas por semana e edição rápida inline por parte para quem designa.
- Eventos especiais (congresso, assembleia, visita do superintendente de circuito) ocultam as reuniões da semana ou movem o meio de semana conforme o tipo.
- Escala de limpeza do salão (programação semanal, setores e limpeza geral) nas configurações.

## Brand Commitments

- Nome: Asignaciones.
- Idioma oficial: português do Brasil.

## Evidence on Hand

- Repositório com histórico do app anterior (monorepo apps/web + apps/mobile + packages/shared) com domínio de congregações/pessoas/tokens; removido no commit c50f401.
- Banco PostgreSQL na Neon (neondb) ativo, schema de auth (User/Session/Account/Verification) aplicado.
- Não há testemunhos, casos de estudo ou materiais de imprensa; não inventar.

## Product Principles

1. Qualquer irmão da congregação deve entender e usar o app em segundos, no celular.
2. Quem designa comanda a escala; quem é designado não precisa de conhecimento técnico para consultar.
3. Confiabilidade antes de sofisticação: o que está na escala é a verdade da reunião.
4. O fluxo reflete o ritmo real da congregação (semanal, pontual, respeitoso).
5. Cada recurso existe para reduzir o trabalho manual do organizador, nunca para aumentar a fricção.

## Accessibility & Inclusion

Público em sua maioria não técnico e de diversas idades — interface legível, toques grandes, mínima dependência de memória de navegação.
