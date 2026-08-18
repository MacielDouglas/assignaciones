---
name: Asignaciones
description: Designações de tarefas e reuniões para equipes — monocromático, preciso e totalmente responsivo.
colors:
  tinta: "oklch(0.205 0 0)"
  tinta-clara: "oklch(0.922 0 0)"
  pagina: "oklch(1 0 0)"
  letra: "oklch(0.145 0 0)"
  cartao: "oklch(1 0 0)"
  cinza-palido: "oklch(0.97 0 0)"
  cinza-medio: "oklch(0.556 0 0)"
  linha-fina: "oklch(0.922 0 0)"
  aro: "oklch(0.708 0 0)"
  alerta: "oklch(0.577 0.245 27.325)"
  pagina-escura: "oklch(0.145 0 0)"
  cartao-escuro: "oklch(0.205 0 0)"
  linha-escura: "oklch(1 0 0 / 10%)"
  alerta-escuro: "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
  pill: "26px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.pagina}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "10px 12px"
  button-primary-hover:
    backgroundColor: "oklch(0.205 0 0 / 80%)"
  button-outline:
    backgroundColor: "{colors.pagina}"
    textColor: "{colors.letra}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "10px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.letra}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.letra}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.letra}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "4px 10px"
  badge:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.pagina}"
    rounded: "{rounded.pill}"
    height: "20px"
    padding: "2px 8px"
---

# Design System: Asignaciones

## Overview

**Creative North Star: "O Quadro de Designações"**

Cada tarefa e cada reunião visível como um cartão num quadro bem posto: ordem calma, tinta forte sobre página limpa, nada competindo pela atenção. O sistema é deliberadamente restrito e funcional — a única cor saturada do sistema inteiro é o vermelho de alerta, e ele só aparece quando algo exige ação. Tudo o mais vive na escala de cinza, do branco da página ao preto da tinta.

A estrutura de layout segue a gramática de um portal corporativo moderno (referência: a organização por seções, hero e cartas do site da Estapar — apenas a estrutura, jamais a paleta): seções nomeadas que se empilham com ritmo claro, hero em destaque no topo, grades de cartões que se reorganizam de 1 coluna (370px) a 3 colunas (full HD). A responsividade total não é um capricho: o produto é usado tanto no navegador quanto no app nativo, e a mesma informação precisa caber nos dois.

O app nativo espelha o mesmo sistema com tipografia do sistema operacional (System) e tokens hex equivalentes; a densidade é a mesma, com alvos de toque de 48px em vez dos 32px do web.

**Key Characteristics:**
- Monocromático por construção: um acento apenas, e ele é neutro; o vermelho só existe para alertas
- Flat por padrão: profundidade vem de bordas e anéis (rings), nunca de sombras
- Densidade compacta no web (controles de 32px de altura), generosa no nativo (48px)
- Cantos moderadamente arredondados: 6–14px em superfícies, pílula apenas em badges
- Tipografia Geist (web) / System (nativo), sem serifas, sem variação decorativa
- Tema claro e escuro completos, invertendo o par tinta/página

## Colors

A paleta é a escala do papel e da tinta, com um único alerta vermelho. No tema claro, o fundo é branco puro e a tinta é quase-preta; no escuro, os dois trocam de lugar — o par se inverte por inteiro.

### Primary
- **Tinta** (`oklch(0.205 0 0)`; nativo `#0A0A0A`): a cor de ação. Botões primários, badges default, elementos interativos sólidos. No tema escuro vira **Tinta Clara** (`oklch(0.922 0 0)`) sobre fundo escuro.
- **Tinta Clara** (`oklch(0.922 0 0)`): o primário invertido do tema escuro.

### Neutral
- **Página** (`oklch(1 0 0)`; nativo `#FFFFFF`): fundo principal. No escuro, **Página Escura** (`oklch(0.145 0 0)`; nativo `#0A0A0A`).
- **Letra** (`oklch(0.145 0 0)`; nativo `#0A0A0A`): texto principal e títulos. No escuro, o branco `oklch(0.985 0 0)`.
- **Cartão** (`oklch(1 0 0)`; nativo `#FFFFFF`, escuro `#1A1A1A`): superfície de cartões, popovers e modais. No escuro sobe um degrau da página para separar camadas.
- **Cinza Pálido** (`oklch(0.97 0 0)`; nativo `#F5F5F5`): fundos secundários — hover de botões ghost/outline, headers de seção, `muted` e `accent`.
- **Cinza Médio** (`oklch(0.556 0 0)`; nativo `#737373`): texto secundário, descrições, placeholders. No escuro, `oklch(0.708 0 0)`.
- **Linha Fina** (`oklch(0.922 0 0)`; nativo `#E5E5E5`): bordas de inputs e separadores. No escuro, branco a 10% (`oklch(1 0 0 / 10%)`) e inputs a 15%.
- **Aro** (`oklch(0.708 0 0)`; nativo `#B4B4B4`): anel de foco.

### Secondary / Tertiary
Não existem. O sistema não tem segundo acento — se um elemento precisa de mais força que a tinta, ele usa tinta mais clara ou mais escura, nunca outra cor.

### Named Rules
**A Regra do Alerta Único.** O vermelho `destructive` (`oklch(0.577 0.245 27.325)`; escuro `oklch(0.704 0.191 22.216)`) é a única cor saturada do sistema. Ele existe para erros, exclusões e estados que exigem atenção imediata — e só para isso. Nenhum decorativo, gradiente ou destaque de marca pode usar cor.

**A Regra da Tinta Invertida.** Em qualquer lugar onde o fundo escurece, o primário clareia: a relação tinta/página é um par que se inverte junto, nunca uma cor fixa sobre fundos variáveis.

## Typography

**Display Font:** Geist (fallback `system-ui, sans-serif`) — web. **Body Font:** Geist — web. **Native:** System (SF Pro / Roboto), sem face de marca no app.

**Character:** geométrica, neutra e compacta. Sem serifas, sem contraste dramático de pesos — a hierarquia vem de tamanho e espaçamento negativos, não de ornamentos.

### Hierarchy
- **Display** (700, `clamp(1.875rem, 5vw, 3.75rem)`, 1.1, `-0.025em`): apenas a mensagem principal — hero do marketing, títulos de página de abertura.
- **Title** (600, 1.125rem, 1.3): títulos de cartões, cabeçalhos de seção, nomes de tela no app. No nativo: heading 20px/600.
- **Body** (400, 0.875rem, 1.5): texto corrente; no nativo, 16px. Linhas de 65–75ch quando em parágrafo.
- **Label** (500, 0.75rem, normal): rótulos de controles, badges, metadados. No nativo, small 14px.

### Named Rules
**A Regra do Título de Cartão.** Títulos dentro de cartões usam Title 600 — nunca Display. Display é privilégio do topo da página; rebaixar para cartões faz a hierarquia desmoronar.

## Layout

Mobile-first, de 370px a full HD. A gramática vem do portal corporativo de referência: seções nomeadas empilhadas com ritmo, hero em destaque no topo, grades de cartões responsivas.

- **Container:** `max-w-6xl` (1152px), centralizado, com padding lateral de 16px (370px) → 24px (sm) → 32px (lg).
- **Grid de cartões:** 1 coluna por padrão; 2 colunas em `sm` (640px); 3 colunas em `lg` (1024px). Intervalo de 16px entre cartões.
- **Ritmo de seção:** padding vertical 16px (móvel) → 24px (sm) → 32px (lg); seções hero com 24px → 32px. Separadores de linha fina entre seções.
- **Espaçamento interno:** escala 4 / 8 / 12 / 16 / 24 / 32 / 48px (nativa do app; `spacing.xs` a `3xl`). Cards usam 16px (web) ou 24px (nativo).
- **Densidade:** web compacta — controles de 32px de altura, botões com padding `10px 12px`; nativo generoso — alvos de toque de 48px.

## Elevation & Depth

Flat por padrão. Não há sombras no sistema: profundidade é sinalizada por bordas e anéis. Um cartão sobre a página se distingue por um anel de 1px `ring-foreground/10` (web) ou borda `#E5E5E5` (nativo) — nunca por sombra. Camadas sobrepostas (popover, modal, dropdown) se distinguem pelo fundo `card` que sobe um degrau tonal no tema escuro.

### Named Rules
**A Regra Flat-Por-Definição.** Superfícies são planas em repouso. Sombras não existem em nenhum estado; interação se sinaliza por mudança de cor de fundo (`hover:bg-muted`), anel de foco e deslocamento de 1px no clique (`active:translate-y-px`).

## Shapes

Cantos moderadamente arredondados, em escala uniforme a partir de uma base de 10px (`--radius`): 6px (sm), 8px (md), 10px (lg), 14px (xl), 18px (2xl). Botões e inputs usam 8px; cartões 14px (nativo 16px); a única exceção é o badge, em pílula completa (26px). Sem clipping, sem silhuetas assimétricas — a forma é sempre um retângulo com cantos suaves.

## Components

### Buttons
- **Shape:** cantos suaves de 8px (`rounded-md`), altura 32px no web, 48px no nativo.
- **Primary:** fundo Tinta, texto Página, padding `10px 12px`. Hover: tinta a 80%. Clique: deslocamento de 1px para baixo. Nativo: opacidade 0.8 ao pressionar.
- **Hover / Focus:** foco visível com anel de 3px `ring-ring/50` + borda `ring`; hover muda o fundo para `muted` nas variantes outline/ghost.
- **Outline / Ghost / Secondary:** outline com borda `border` e fundo página; ghost sem borda, fundo muda no hover; secondary com fundo `secondary`. Todas as variantes compartilham altura, raio e tipografia.
- **Disabled:** opacidade 50%, sem interação. `aria-invalid` recebe borda e anel `destructive`.

### Cards
- **Corner Style:** 14px no web (`rounded-xl`), 16px no nativo.
- **Background:** Cartão; no tema escuro sobe um degrau da Página.
- **Shadow Strategy:** nenhuma — anel de 1px `foreground/10` (web) ou borda (nativo).
- **Internal Padding:** 16px (web, `card-spacing` 4) ou 24px (nativo); cartões `sm` usam 12px.
- **Border:** anel sutil, nunca borda dura.
- Título em Title 600, descrição em Body cor Cinza Médio, rodapé com fundo Cinza Pálido e borda superior.

### Inputs / Fields
- **Style:** altura 32px (web) / 48px (nativo), cantos de 8px (nativo 12px), borda `input` de 1px, fundo transparente (nativo: Cinza Pálido).
- **Focus:** borda troca para `ring` + anel de foco de 3px `ring/50`.
- **Error / Disabled:** `aria-invalid` troca borda e anel para `destructive`; disabled fica com opacidade 50% e fundo `input/50`.

### Badges
- **Style:** pílula completa (26px), altura 20px, texto Label 12px/500, padding `2px 8px`.
- **State:** variantes default (Tinta/Página), secondary, outline (borda + texto Letra), destructive (fundo `destructive/10`, texto `destructive`), ghost e link. Hover em `a` reduz a opacidade do fundo.

### Navigation
- **Web:** sem barra global customizada — links e botões inline com as variantes padrão; no marketing, navegação minimalista por texto.
- **Nativo:** sistema de navegação da plataforma (stack/tab nativos do Expo Router); botões e cards do sistema acima; títulos de tela em heading 20px/600.

## Do's and Don'ts

### Do:
- **Do** manter a página, os cartões e os controles dentro da escala de cinza; o vermelho é reservado a alertas.
- **Do** usar anéis e bordas para profundidade — sombras não fazem parte do sistema.
- **Do** usar a escala de raios (6–18px) e a pílula só para badges.
- **Do** pensar em 1 coluna antes de 3: o layout nasce no móvel e cresce para desktop.
- **Do** usar Tinta para ações primárias e Cinza Pálido para hovers — nunca inverter os papéis.
- **Do** espelhar estados completos (hover, foco, disabled, erro) em cada controle novo.

### Don't:
- **Don't** introduzir um segundo acento de cor, gradientes ou imagens com cor de marca no produto.
- **Don't** usar Display fora do topo da página — cartões usam Title.
- **Don't** adicionar sombras projetadas a cartões, modais ou menus.
- **Don't** criar controles com altura menor que 32px no web ou 48px no nativo.
- **Don't** misturar tipografia: Geist (web) e System (nativo) são as únicas famílias.
- **Don't** ignorar o tema escuro — cada cor nova precisa do par invertido.