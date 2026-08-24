---
name: Asignaciones
description: Gestão de designações e membros da congregação — simples, clara e serena.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  success: "#15803d"
  warning: "#b45309"
  section-treasures: "#3c7f8b"
  section-ministry: "#d68f00"
  section-living: "#bf2f13"
  section-neutral: "#64748b"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  full: "9999px"
  lg: "0.75rem"
  xl: "1rem"
  "2xl": "1.25rem"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "44px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
  badge-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
---

# Design System: Asignaciones

## Overview

**Creative North Star: "O Quadro de Avisos da Congregação"**

O Asignaciones é o quadro de avisos da congregação: um lugar onde todos sabem onde olhar e encontram a resposta sem esforço. O sistema é inspirado na serenidade e na clareza dos grandes sites de produto — layout espaçoso, tipografia display confiante, textos curtos e diretos — aplicados a um público não técnico que usa o celular em qualquer contexto, inclusive na rua ou no salão.

A paleta é estritamente acromática: preto profundo sobre branco puro, com cinzas silenciosos como única gradação. A hierarquia é feita por peso e tamanho tipográfico, nunca por cor. Botões em pílula, superfícies planas definidas por linhas hairline, e um espaçamento generoso que dá ar para respirar. Nada é decorativo; tudo é leitura.

**Key Characteristics:**
- Fundo branco puro com texto quase-preto — contraste máximo, dignidade serena
- Uma única escala tipográfica (Inter) com pesos fortes nos títulos
- Botões em formato pílula, refinados e restritos
- Superfícies planas; profundidade por linhas hairline e camadas tonais, nunca por sombra
- Espaçamento generoso e textos curtos em PT-BR, sem jargão
- Mobile-first: uma coluna, conteúdo centralizado, toque confortável

## Colors

Paleta acromática com uma única exceção funcional — a cor só existe quando significa algo.

### Primary
- **Preto Profundo** (oklch(0.205 0 0)): ação. Botões primários, texto de destaque e o tile de ícone da marca. É o elemento de maior autoridade da tela.

### Neutral
- **Branco Puro** (oklch(1 0 0)): fundo de tela e de superfícies (cards). É a cor de repouso; a maior parte da tela é branca.
- **Texto Escuro** (oklch(0.145 0 0)): corpo de texto em geral.
- **Cinza Silencioso** (oklch(0.97 0 0)): superfícies de apoio (badges, footer de cards, avatar fallback) — tom mais claro que o fundo.
- **Texto Suave** (oklch(0.556 0 0)): descrições, legendas e metadados.
- **Linha Hairline** (oklch(0.922 0 0)): bordas e anéis de contorno de superfícies.

### Tertiary
- **Vermelho de Alerta** (oklch(0.577 0.245 27.325)): apenas para erro e destruição (ex.: excluir designação).
- **Verde de Confirmação** (`--success`; claro `#15803d`, escuro `#4ade80`): apenas estado confirmado/salvo (ex.: badge "Programação salva"), sempre acompanhado de ícone.
- **Âmbar de Atenção** (`--warning`; claro `#b45309`, escuro `#fbbf24`): apenas aviso pendente ou lacuna a resolver (ex.: "Horário padrão em uso", vaga não preenchida), sempre acompanhado de ícone ou marcador textual.

### Named Rules
**A Regra do Silêncio Cromático.** Nenhuma cor decorativa em qualquer tela. Uma cor cromática só pode aparecer carregando significado — e somente estas três: vermelho para erro, verde para confirmação, âmbar para pendência. Ação, seleção e navegação permanecem acromáticos. Informação nunca depende só de cor: ícone, texto ou posição acompanham todo uso cromático.

## Typography

**Display Font:** Inter (via next/font, com system-ui e sans-serif como fallback)
**Body Font:** Inter

**Character:** Tipografia de produto serena — geométrica, neutra e impecavelmente legível, no espírito das fontes system dos grandes sites. A voz é confiante sem ser ruidosa: títulos pesados e estreitos, corpo leve e arejado.

### Hierarchy
- **Display** (700, 2rem, 1.15, letter-spacing -0.02em): título principal de tela — uma única frase forte ("Asignaciones").
- **Title** (600, 1.25rem, 1.2, letter-spacing -0.01em): títulos de card e de seção.
- **Body** (400, 0.875rem, 1.5): textos de leitura, descrições e metadados. Manter linhas curtas (até ~40ch em telas estreitas).
- **Label** (500, 0.75rem, 1.4): legendas legais, microtextos e metadados discretos.

### Named Rules
**A Regra do Peso, Não da Cor.** A hierarquia tipográfica é feita exclusivamente por peso, tamanho e espaçamento. Textos em cinza indicam hierarquia secundária, não desativação.

## Layout

Sistema mobile-first de uma coluna: o conteúdo vive centralizado em um container estreito (max-w-sm) com padding lateral generoso (px-6) e alinhamento vertical central na tela (flex centering). O ritmo vertical segue uma escala de espaçamento de 8px (xs 8, sm 12, md 16, lg 24, xl 32), com cards usando 16px interno (spacing 4). Entre blocos, espaço amplo — respirar é parte do design. Em telas maiores, o mesmo container estreito é enquadrado com borda hairline (o card passa a ter contorno); no celular, a superfície se funde ao fundo.

## Elevation & Depth

Sistema essencialmente flat: nenhuma sombra difusa em nenhum componente. A profundidade é construída por dois recursos apenas: linhas hairline de 1px (borda/anel com 10% de preto) para definir contornos de superfície, e camadas tonais (Cinza Silencioso sobre Branco Puro) para separar superfícies de apoio.

### Named Rules
**A Regra do Flat Silencioso.** Superfícies são planas em repouso e na interação. Se um elemento precisa se destacar, ganha contorno — nunca sombra.

## Shapes

Linguagem de formas em duas famílias: **pílula para interação**, **cantos suaves para conteúdo**. Botões e badges são pílulas totalmente arredondadas (9999px) — o gesto tátil estilo Apple. Cards, tiles de ícone e agrupamentos usam cantos suaves (cards 12px, tiles de ícone 16px). Avatares são círculos perfeitos.

### Named Rules
**A Regra da Pílula e do Cartão.** O que é tocável é pílula; o que contém conteúdo é cartão com cantos suaves. As duas formas nunca se misturam no mesmo elemento.

## Components

### Buttons
- **Shape:** pílula (9999px), refinados e restritos
- **Primary:** fundo Preto Profundo, texto Branco Puro, altura 44px (h-9 na escala atual), padding horizontal 22px, texto 14px medium — o gesto de ação dominante
- **Outline:** fundo Branco Puro, texto Preto Profundo, borda hairline — a alternativa calma (ex.: "Continuar com o Google")
- **Hover / Focus:** hover reduz a opacidade do fundo para 80%; foco visível com anel de 3px (ring-ring/50); clique com deslocamento sutil de 1px
- **Secondary:** fundo Cinza Silencioso, texto Texto Escuro

### Cards / Containers
- **Corner Style:** cantos suaves (12px, rounded-xl)
- **Background:** Branco Puro (bg-card)
- **Border:** anel hairline de 1px (ring-1 ring-foreground/10); no mobile, cards de boas-vindas ficam sem contorno (border-0 shadow-none)
- **Internal Padding:** 16px (spacing 4), título 14px medium sem peso extra — o título do card é legível, não grita

### Chips / Badges
- **Style:** pílula (9999px), altura 20px, fundo Cinza Silencioso, texto Texto Suave, texto 12px medium — discretos como anotações no quadro
- **State:** secundário para estados informativos; destructive (fundo vermelho 10%) apenas para erro

### Inputs / Fields
- **Style:** fundo Branco Puro, borda hairline de 1px, cantos suaves (10px)
- **Focus:** anel de foco de 3px (ring-ring/50) com borda marcada
- **Error:** borda e anel no Vermelho de Alerta

### Avatar
- **Shape:** círculo perfeito; anel interno de 1px com mix-blend para manter contraste sobre qualquer foto (inclusive fotos de perfil Google)
- **Fallback:** fundo Cinza Silencioso com iniciais em Texto Suave

### Tiles de ícone (Signature Component)
- Quadrado com cantos suaves (16px), fundo Preto Profundo a 10% de opacidade, ícone em Preto Profundo — o emblema da marca (ex.: calendário na tela de boas-vindas)

## Do's and Don'ts

### Do:
- **Do** usar o Display para uma única frase forte por tela — títulos longos quebram a serenidade
- **Do** escrever em PT-BR, curto e direto, sem jargão técnico ("Organize as designações da sua congregação de forma simples e colaborativa")
- **Do** deixar espaço: se a tela parece vazia demais, está certa
- **Do** usar cinza para reduzir hierarquia em vez de diminuir o tamanho
- **Do** manter as duas famílias de formas: pílula para tocar, cantos suaves para conter

### Don't:
- **Don't** usar qualquer cor decorativa — uma cor cromática só com significado (erro)
- **Don't** usar sombras difusas ou elevação simulada em superfícies
- **Don't** misturar muitas escalas tipográficas em uma tela (máximo display + title/body + label)
- **Don't** usar emojis, ícones coloridos ou branding festivo — o quadro de avisos é sóbrio
- **Don't** lotar telas estreitas de informações — uma ação principal por tela