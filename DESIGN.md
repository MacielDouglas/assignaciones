---
name: Asignaciones
description: Gestão de designações e membros da congregação — simples, clara e serena.
colors:
  background: "#f5f5f7"
  foreground: "#1d1d1f"
  card: "#ffffff"
  primary: "#0071e3"
  primary-foreground: "#ffffff"
  secondary: "#e8e8ed"
  muted: "#e8e8ed"
  muted-foreground: "#6e6e73"
  accent: "#e8e8ed"
  border: "#d2d2d7"
  destructive: "#ff453a"
  success: "#15803d"
  warning: "#b45309"
  ring: "#0071e3"
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
  md: "0.6rem"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
  3xl: "1.65rem"
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
    height: "44px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    height: "44px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
---

# Design System: Asignaciones

## Overview

**Creative North Star: "O Quadro de Avisos da Congregação"**

O Asignaciones é o quadro de avisos da congregação: um lugar onde todos sabem onde olhar e encontram a resposta sem esforço. O sistema é inspirado na serenidade e na clareza dos grandes sites de produto — layout espaçoso, tipografia display confiante, textos curtos e diretos — aplicado a um público não técnico que usa o celular em qualquer contexto, inclusive na rua ou no salão.

A base é neutra e silenciosa (cinza-claro Apple sobre branco), com um único azul de ação (#0071e3) reservado para tocar, selecionar e navegar. As reuniões recebem cores de identidade herdadas do programa oficial impresso — Tesouros (teal), Ministério (âmbar), Vida Cristã (coral) — sempre como fundo tonalizado muito claro com ícone/título intensos, nunca como decoração solta. Botões em pílula, superfícies em cartões de cantos suaves com borda hairline e sombra mínima.

**Key Characteristics:**
- Fundo cinza-claro (#f5f5f7) com cartões brancos — profundidade por camada sutil, não por contraste duro
- Azul de ação exclusivo para interação; hierarquia de texto por peso e tamanho
- Cores de seção temáticas nas programações de reunião (identidade do programa impresso)
- Botões em formato pílula; cartões com cantos suaves (2xl) e borda hairline
- Uma única escala tipográfica (Inter): display 32 · title 20 · body 14 · label 12
- Mobile-first: uma coluna, barra inferior de navegação, toque confortável

## Colors

Paleta neutra serena com azul de ação e cores funcionais que só aparecem carregando significado.

### Primary
- **Azul Ação** (#0071e3): botão primário, links, item ativo de navegação, foco (ring). É a cor de "tocar aqui" — raridade intencional em cada tela.

### Neutral
- **Fundo Cinza-Claro** (#f5f5f7): fundo de tela.
- **Cartão Branco** (#ffffff): superfície de conteúdo (bg-card).
- **Texto Escuro** (#1d1d1f): corpo de texto e títulos.
- **Texto Suave** (#6e6e73): descrições, legendas e metadados.
- **Cinza de Apoio** (#e8e8ed): badges secundários, chips, superfícies mutadas.
- **Linha Hairline** (#d2d2d7): bordas, divisores e inputs.

### Semânticas
- **Vermelho de Alerta** (#ff453a): apenas erro e destruição, sempre com ícone.
- **Verde de Confirmação** (#15803d): apenas estado salvo/confirmado (ex.: "Programação salva"), sempre com ícone.
- **Âmbar de Atenção** (#b45309): apenas pendência ou lacuna a resolver (ex.: "Horário padrão em uso", vaga não preenchida), sempre com ícone ou marcador textual.

### Cores de Seção (reuniões)
Identidade das partes do programa oficial aplicadas como fundo tonalizado claro (mix ~8% sobre branco), ícone sólido e título escurecido na mesma matiz:
- **Tesouros** (#3c7f8b, teal): seção Tesouros da Palavra de Deus.
- **Ministério** (#d68f00, âmbar-dourado): Faça Seu Melhor no Ministério.
- **Vida Cristã** (#bf2f13, coral): Nossa Vida Cristã.
- **Neutro** (#64748b, ardósia): abertura, encerramento e seções do fim de semana.

### Named Rules
**A Regra da Cor com Significado.** Cor cromática só existe carregando significado: azul para ação, vermelho para erro, verde para confirmação, âmbar para pendência e as quatro cores de seção dentro da programação. Informação nunca depende só de cor: ícone, texto ou posição acompanha todo uso cromático.

## Typography

**Display Font:** Inter (via next/font, com system-ui e sans-serif como fallback)
**Body Font:** Inter

**Character:** Tipografia de produto serena — geométrica, neutra e impecavelmente legível. A voz é confiante sem ser ruidosa: títulos pesados e levemente estreitos, corpo leve e arejado.

### Hierarchy
- **Display** (700, 2rem, 1.15, letter-spacing -0.02em): título principal de tela.
- **Title** (600, 1.25rem, 1.2, letter-spacing -0.01em): títulos de card e de seção.
- **Body** (400, 0.875rem, 1.5): textos de leitura, descrições e metadados. Linhas curtas em telas estreitas.
- **Label** (500, 0.75rem, 1.4): legendas, chips e metadados discretos.

### Named Rules
**A Regra do Peso, Não da Cor.** A hierarquia tipográfica é feita por peso, tamanho e espaçamento. Textos em cinza indicam hierarquia secundária, não desativação. Tamanhos fora dos quatro steps são proibidos.

## Layout

Sistema mobile-first de uma coluna: container central `max-w-4xl`, padding lateral 16px no celular e 24px a partir de `sm`. Navegação global em header fixo no topo e barra inferior de ícones no celular (escondida em `md`). O ritmo vertical segue escala de 8px (xs 8, sm 12, md 16, lg 24, xl 32); linhas de programação usam padding vertical compacto (10–14px) para densidade de quadro de avisos. Entre blocos grandes, espaço amplo — respirar é parte do design.

## Elevation & Depth

Base quase-flat: superfícies em repouso usam borda hairline + `shadow-xs`; profundidade adicional apenas em elementos momentâneos (popover, diálogo) e no tile de ícone das seções (`shadow-sm`). Nada de halos coloridos de offset zero.

### Named Rules
**A Regra da Sombra Discreta.** Sombra é exceção curta e suave (xs/sm), nunca identidade. Em repouso, contorno hairline resolve.

## Shapes

Duas famílias: **pílula para interação** (botões, badges, chips, abas — 9999px) e **cantos suaves para conteúdo** (cartões 2xl ≈ 22px, blocos de seção 2xl, inputs xl ≈ 17px). Avatares são círculos perfeitos.

### Named Rules
**A Regra da Pílula e do Cartão.** O que é tocável é pílula; o que contém conteúdo é cartão. As duas formas não se misturam no mesmo elemento.

## Components

### Buttons
- **Shape:** pílula (9999px)
- **Primary:** fundo Azul Ação, texto branco, altura 44px (h-11), padding horizontal 20px, texto 14px medium
- **Outline:** fundo Cartão Branco, texto Texto Escuro, borda hairline — alternativa calma
- **Secondary:** fundo Cinza de Apoio, texto Texto Escuro
- **Hover / Focus:** hover escurece o fundo para 90%; foco visível com anel de 3px (ring-ring/50)

### Cards / Containers
- **Corner Style:** 2xl (≈22px)
- **Background:** Cartão Branco (bg-card) sobre Fundo Cinza-Claro
- **Border:** hairline 1px (border-border) + shadow-xs
- **Internal Padding:** 16px; título em Title/Body medium conforme densidade

### Chips / Badges
- **Style:** pílula, altura mínima 24px, fundo Cinza de Apoio ou tinta semântica a 10%, texto 12px medium
- **State:** secundário informativo; success/warning/destructive apenas com significado

### Inputs / Fields
- **Style:** fundo Cartão Branco, borda hairline, cantos xl
- **Focus:** anel de foco de 3px (ring-ring/50) com borda marcada
- **Error:** borda e anel no Vermelho de Alerta

### Tiles de ícone (seções de reunião)
Quadrado com cantos suaves (xl), fundo na cor sólida da seção, ícone branco grande (24–28px) — o emblema que herda o programa impresso.

## Do's and Don'ts

### Do:
- **Do** escrever em PT-BR, curto e direto, sem jargão técnico
- **Do** usar o azul apenas onde há ação; tudo o mais é neutro
- **Do** aplicar cores de seção como fundo tonal claro + ícone sólido, fiel ao programa impresso
- **Do** manter as duas famílias de formas: pílula para tocar, cartão para conter
- **Do** densificar linhas de programação (quadro de avisos), não transformá-las em cards independentes

### Don't:
- **Don't** introduzir cores fora da paleta ou usar cor sem significado
- **Don't** usar sombras difusas grandes ou halos de offset zero
- **Don't** misturar escalas tipográficas fora dos quatro steps
- **Don't** usar emojis como ícones de interface
- **Don't** lotar telas estreitas — uma ação principal por região
