---
target: reunioes
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
timestamp: 2026-08-24T16-53-45Z
slug: src-app-dashboard-reunioes-page-tsx
---
# Crítica de Design — Página Reuniões

Method: dual-agent (A: ses_fcb545017ffetXHJE8wC72bN2d · B: ses_fcb56017cffeGqEcYKp1SKav92)

## Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|-----------|:----:|----------------|
| 1 | Visibilidade do status | 3 | Diálogo fecha antes do refresh (flash de dado velho); dots baixa fidelidade |
| 2 | Match sistema/mundo real | 3 | Vocabulário exato; falha: ">" significando "editar" |
| 3 | Controle e liberdade | 2 | Sem undo após salvar; trocar de aba descarta a semana da URL |
| 4 | Consistência e padrões | 2 | Implementação diverge do DESIGN.md (azul decorativo × silêncio cromático) |
| 5 | Prevenção de erros | 3 | PeoplePicker codifica elegibilidade; cancelar descarta sem aviso |
| 6 | Reconhecimento × recall | 2 | Botões só-ícone; diálogo não mostra qual parte está sendo editada |
| 7 | Flexibilidade e eficiência | 3 | Deep links por semana/aba, prefetch, edição inline rápida |
| 8 | Estética minimalista | 3 | Escaneável; parágrafo inspiracional longo no card de evento |
| 9 | Recuperação de erros | 3 | Toast com mensagem do servidor; motivos inline no picker |
| 10 | Ajuda e documentação | 2 | Empty states orientam; ícones e dots não se explicam |
| Total | | 28/40 | Bom — fundação sólida, pontos fracos pontuais |

## Veredito de especificidade

Autoral para o domínio: seções espelham o programa oficial (Tesouros=diamante/teal, Ministério=âmbar, Vida Cristã=coral/ovelha), linha do Presidente, vocabulário exato (apostila, cântico, publicador) e copy por papel no estado vazio. Ponto genérico: modal de edição CRUD padrão. Cisão interna: DESIGN.md declara paleta acromática flat, mas a implementação usa azul Apple (#0071e3) e gradientes/sombras nos cards de evento.

Scan determinístico (Avaliação B): 0 achados (src/app/dashboard/reunioes + src/features/meetings/components, exit 0). Todos os problemas são de interação/julgamento, invisíveis ao scanner. Overlay indisponível: sem puppeteer/playwright e página atrás de Google OAuth — browser step skipped com razão concreta.

## Prioridades

[P0] Trocar de aba perde a semana: MeetingTabs.selectTab faz router.replace(?tab=X) descartando week (meeting-tabs.tsx:27). Fix: preservar week no replace. Comando: /impeccable harden

[P1] Sobrescrita livre do programa sem rede de segurança: título/horário/duração em texto livre salvam sem diff/undo. Fix: preview antes/depois ou separar designar pessoas de editar parte; toast com desfazer. Comando: /impeccable harden

[P1] Diálogo sem contexto: título genérico "Editar parte" + só horário/duração. Fix: DialogTitle = título atual da parte; descrição com a seção. Comando: /impeccable clarify

[P1] Aba Fim de Semana vazia em hideMeetings: TabsContent em branco parece bug. Fix: estado vazio explícito ou aba desabilitada com explicação. Comando: /impeccable onboard

[P1] Semântica do chevron: presidente mantém chevron estático para consultores; editor precisa de affordance mais explícita (lápis, ≥44px). Comando: /impeccable polish

[P2] Indicadores vagos: CalendarCog/FilePlus2 sem rótulo; 3 dots sem contador; Total X min só em lg. Fix: "8/12" junto aos dots; total no mobile. Comando: /impeccable clarify

## Personas

Alex (power user): perda do week na troca de aba; ~15 aberturas de diálogo para montar a semana sem modo bulk; sem atalhos/swipe.

Sam (acessibilidade): chevron 32px e ícones fantasma dependentes de aria-label; contraste limítrofe do âmbar sobre tinta; dots sem número; data compacta fora do sr-only.

Casey (mobile distraído): chip de horário idêntico no padrão e provisório; aba branca em congresso parece bug; ícones sem texto no topo; 6 itens na bottom bar apertam labels de 11px.

## Observações menores

- DESIGN.md × globals.css: acromático vs. azul Apple — resolver com /impeccable doctor ou document
- SpecialEventCard duplica "Data" e "Período" com o mesmo valor
- Fallbacks "19:30"/"09:30" renderizam como verdade sem sinalização no chip
- Sintaxe mista bg-gradient-to-b (v3) vs bg-linear-to-b (v4)

## Questões

- Por que admin reescreve o título do programa sem histórico/undo?
- O que o ">" significa para quem só consulta?
- "Faltam N designações" seria um indicador mais honesto que os dots?
