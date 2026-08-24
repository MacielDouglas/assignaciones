---
target: reunioes
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-24T17-59-47Z
slug: src-app-dashboard-reunioes-page-tsx
---
# Crítica de Design — Página Reuniões (3ª rodada)

Method: dual-agent (A: ses_fcb186d21ffeqfG5i6Ogia5fsu · B: ses_fcb185b84ffeEPGABrtU4vp80j)

## Design Health Score

| # | Heurística | Nota |
|---|-----------|:----:|
| 1 | Visibilidade do status | 3 |
| 2 | Match sistema/mundo real | 4 |
| 3 | Controle e liberdade | 3 |
| 4 | Consistência e padrões | 3 |
| 5 | Prevenção de erros | 4 |
| 6 | Reconhecimento × recall | 4 |
| 7 | Flexibilidade e eficiência | 3 |
| 8 | Estética minimalista | 3 |
| 9 | Recuperação de erros | 3 |
| 10 | Ajuda e documentação | 2 |
| Total | | 32/40 |

Fixes da rodada 2 verificados: Desfazer 10s ✓; lápis só com slots/44px/contraste ✓; SpecialEventCard neutro hairline tile ardósia ✓; dots ceil ✓; studentSlot hoisted ✓; nomes próprios preservados ✓; tile estado vazio ardósia ✓.

REGRESSÃO introduzida: botões Programar/Importar com size="icon" (44px fixo) + rótulo hidden sm:inline dentro do quadrado — texto transborda em ≥sm. Fix: sm:w-auto sm:px-3 mantendo h-11.

Scan determinístico: 0 achados (exit 0). Overlay indisponível: sem puppeteer/playwright + OAuth Google.

## Prioridades

[P1] Rótulos Programar/Importar transbordam a partir de sm (meeting-schedule-card.tsx:174-198). Fix: largura responsiva sm:w-auto sm:px-3 mantendo h-11. Comando: /impeccable polish

[P2] SpecialEventBanner contradiz o sistema: gradiente from-primary/12 via-primary/5, tile bg-gradient-to-br, halo azul (special-event-banner.tsx:27-31). Fix: hairline + tile sólido ardósia. Comando: /impeccable polish

[P2] Horário provisório inexplicável no toque (sr-only insuficiente para vidente). Fix: sufixo visível "19:30 · provisório" ou nota sob o cartão. Comando: /impeccable clarify

[P3] Azul como informação dilui ação: dia em text-primary; faixa superior em gradiente. Fix: dia em foreground; avaliar faixa sólida. Comando: /impeccable colorize

[P3] Menores: text-[11px] na bottom bar; papéis Owner/Admin em inglês; #64748b hardcoded duplicado (extrair token). Comando: /impeccable polish

## Personas

Alex (60+, consulta): lê sem ajuda ✓; chip âmbar gera dúvida; bottom bar sumindo desorienta.
Sam (secretário mobile): fluxo lápis→picker→salvar→desfazer confiável ✓; <640px adivinha ícones; motivo trunca sem expandir.
Casey (admin novo): "faltam 3" instantâneo ✓; não sabe ordem de prioridade nem escala dos dots; hambúrguer duplica bottom bar.

## Observações menores

- EVENT_NOTE terceiro bloco de texto — candidato a corte
- Bottom bar escondida mantém links tabáveis — usar inert
- Busca do picker estilizada à mão vs Input do sistema
- toLowerCase residual em aria-label
- Abas 40px no limite

## Questões

- Quantos toques até o secretário novo achar o lápis?
- Faixa azul vs "azul = toque aqui": o que parece tocável?
- Edição concorrente na mesma semana: quem ganha?
