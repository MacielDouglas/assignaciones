---
target: reunioes
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-24T18-23-07Z
slug: src-app-dashboard-reunioes-page-tsx
---
# Crítica de Design — Página Reuniões (4ª rodada)

Method: dual-agent (A: ses_fcb021c0affe2aZytLPXC4GR0u · B: ses_fcb034b85ffeWyV5Dc6CfETw0b)

## Design Health Score

| # | Heurística | Nota |
|---|-----------|:----:|
| 1 | Visibilidade do status | 4 |
| 2 | Match sistema/mundo real | 4 |
| 3 | Controle e liberdade | 4 |
| 4 | Consistência e padrões | 3 |
| 5 | Prevenção de erros | 3 |
| 6 | Reconhecimento × recall | 3 |
| 7 | Flexibilidade e eficiência | 3 |
| 8 | Estética minimalista | 3 |
| 9 | Recuperação de erros | 3 |
| 10 | Ajuda e documentação | 3 |
| Total | | 33/40 |

Fixes da rodada 3 verificados: geometria responsiva dos botões ✓; SpecialEventBanner hairline + ardósia compartilhada ✓; sufixo provisório visível ✓; bottom bar text-xs ✓; papéis PT-BR ✓; SECTION_NEUTRAL_COLOR única ✓.
Correção sobre A: suposta duplicação sr-only no chip provisório é falso positivo — sufixo visível é aria-hidden.

## Veredito de especificidade

Identidade própria verificável no código (Quadro de Avisos: linhas densas, cápsulas color-mix, tiles sólidos, cor-com-significado). Genérico restante: pontos de entrada ícone-puros e header apertado em 360px — hospitalidade com público 60+, não linguagem.

Scan determinístico (B): 0 achados duros em reunioes/meetings; 1 advisory fora de escopo anterior: src/components/ui/calendar.tsx:34 text-[0.8rem] (shadcn stock) fora da rampa. Overlay indisponível: sem puppeteer/playwright + OAuth Google.

## Prioridades

[P1] CTAs mudos no mobile — Programar/Importar quadrados de ícone onde estão os menos técnicos. Fix: pílulas text-xs em todos os tamanhos ou menu "⋯" rotulado. Comando: /impeccable clarify

[P2] Header satura em ≤360px — chip longo + 2 botões truncam o título. Fix: duração do chip hidden sm:inline; título line-clamp-2. Comando: /impeccable layout

[P2] Validação tardia nos detalhes avançados — duração 0/cântico inválido falham só no toast. Fix: inline + Salvar desabilitado. Comando: /impeccable harden

[P3] Gradiente na faixa superior fora do sistema (from-primary to-primary/85). Fix: bg-primary plano ou exceção registrada no DESIGN.md. Comando: /impeccable polish

[Advisory] calendar.tsx:34 text-[0.8rem] (shadcn stock). Fix: normalizar text-xs ou registrar exceção. Comando: /impeccable polish

## Personas

Alex (60+): não decodifica os dois quadrados; "lápis" ≠ "designar"; resto funciona.
Sam (secretário): ~15 ciclos abrir/salvar; "salvar e próxima parte" seria o multiplicador.
Casey (consultor): sem red flags — "———" e "· provisório" comunicam sem treinamento.

## Observações menores

- Avatares hueFromId fora da paleta — decidir conscientemente
- Tile do estado vazio sem shadow-xs dos outros
- Selo "Ordem por prioridade" poderia dizer a regra ("quem espera há mais tempo")
- toLowerCase residual no aria-label Programar

## Questões

- Botão "Designar" na linha eliminaria a necessidade do disclosure para Alex?
- Os dots somam algo além do "faltam N" ao lado?
- Programar/Importar pertencem ao header de todos ou ao momento de configuração?
