---
target: reunioes
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T17-39-57Z
slug: src-app-dashboard-reunioes-page-tsx
---
# Crítica de Design — Página Reuniões (2ª rodada)

Method: dual-agent (A: ses_fcb29878affeDryyvYFiZDfUHt · B: ses_fcb296ef9ffedtw5SrlAQiguRU)

## Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|-----------|:----:|----------------|
| 1 | Visibilidade do status | 3 | Toast de Desfazer efêmero (~4s) |
| 2 | Match sistema/mundo real | 3 | "Programar" vs "Importar" não se explica para leigo |
| 3 | Controle e liberdade | 3 | Desfazer só em designações; detalhes sem undo |
| 4 | Consistência e padrões | 3 | SpecialEventCard fora do sistema |
| 5 | Prevenção de erros | 4 | Prévia Antes→depois + elegibilidade com motivo |
| 6 | Reconhecimento × recall | 3 | Ícones CalendarCog/FilePlus2 mudos no mobile |
| 7 | Flexibilidade e eficiência | 2 | Sem fluxo em lote (~10 ciclos/semana) |
| 8 | Estética minimalista | 3 | Cabeçalho do card com 5 clusters no mobile |
| 9 | Recuperação de erros | 3 | Depende de ler toasts rápidos |
| 10 | Ajuda e documentação | 2 | title como único explicador |
| Total | | 29/40 | Bom |

Fixes da rodada 1 verificados como resolvidos: P0 ?week= nas abas ✓; diálogo nomeia parte + disclosure avançado com prévia Antes→depois ✓; aba vazia de congresso com estado explícito ✓; contador "faltam N" ✓; total no chip ✓; chevron fantasma removido ✓.

## Veredito de especificidade

Produto lê-se como o quadro de avisos da congregação; diálogo em camadas evidencia design para o usuário real. Dívida: SpecialEventCard importa hero SaaS genérica; ações só-ícone no mobile pressupõem alfabetismo de ícones.

Scan determinístico: 0 achados (exit 0) em src/app/dashboard/reunioes + src/features/meetings/components. Overlay indisponível: sem puppeteer/playwright + OAuth Google.

## Prioridades

[P1] Ações de cabeçalho criptográficas no mobile — CalendarCog/FilePlus2 só-ícone <md; "Programar" duplicado. Fix: texto a partir de sm ou menu Mais; Importar só quando não há apostila. Comando: /impeccable clarify

[P1] Janela de Desfazer curta e frágil — toast ~4s; undo sobrescreve edições concorrentes. Fix: duração 8–10s ou link "Reverter" na linha até próxima navegação. Comando: /impeccable harden

[P2] SpecialEventCard fora do sistema — gradiente 3 camadas, halo blur-3xl, tile azul não-ação. Fix: cartão neutro hairline, tile section-neutral. Comando: /impeccable polish

[P2] Lápis em toda linha inclusive sem slots; hit area 40px<44px. Fix: ocultar ação sem slots; 44px. Comando: /impeccable polish

[P3] Horário provisório dependente de tooltip. Fix: sr-only "horário provisório" no chip. Comando: /impeccable polish

## Personas

Alex: sem lote nem "próxima pendência" (~10 ciclos); dúvida Programar×lápis.
Sam: lápis contraste baixo + 40px; title como única explicação; combobox popover exige foco gerenciado.
Casey: navegação à prova de distração ✓; mis-tap no lápis por linha; toast 4s perde o undo.

## Observações menores

- ProgressDots Math.round: 1/9 mostra 0 dots com "faltam 8"
- studentSlot recalculado dentro do .map()
- Minúsculas forçadas podem estragar nomes próprios de evento
- INSPIRING_MESSAGE longo demais
- size="icon-sm" + override size-10 é indireção

## Questões

- Por que duas ações secundárias disputam a faixa do título?
- "Completa" merece verde semântico ou basta ausência de âmbar?
- O lápis-por-linha sobrevive ao pedido de "montar tudo numa tela"?
