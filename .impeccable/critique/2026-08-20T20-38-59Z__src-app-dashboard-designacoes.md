---
target: critique na página Designações e em todos os seus componentes, com a página membros como modelo
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
p2_count: 2
p3_count: 2
timestamp: 2026-08-20T20-38-59Z
slug: src-app-dashboard-designacoes
---
# Critique: Designações (src/app/dashboard/designacoes)

Method: dual-agent (A: ses_fdf1f4226fferarlnxhskPneck · B: ses_fdf1f278affeoK2Ehkx4kppu0E)

## Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|-----------|------|----------------|
| 1 | Visibilidade do status | 3 | Estados de salvando/excluindo e toasts bons; zero indicador de "alterações não salvas" ao sair do Programar |
| 2 | Correspondência mundo real | 3 | Programação fiel ao domínio; rótulos em espanhol e campos técnicos (hex, symbol) quebram a língua do usuário |
| 3 | Controle e liberdade | 2 | Tabs sem estado de URL, saída silenciosa com trabalho não salvo, `window.confirm` sem cancelamento estilizado |
| 4 | Consistência e padrões | 2 | 3 idiomas de empty state, 2 wrappers de tabs, 2 diálogos, `font-mono` vs sans, skeleton `rounded-lg` vs pílula |
| 5 | Prevenção de erros | 2 | Diálogo de duplicado bom; foco perdido ao digitar (remount), salvar sempre habilitado, delete sem consequência |
| 6 | Reconhecimento em vez de memória | 2 | Estado por semana é restaurado; 3 controles redundantes de semana e tab não persistente |
| 7 | Flexibilidade e eficiência | 2 | Nenhum acelerador: sem busca em selects, sem "designar próxima", sem atalhos |
| 8 | Estética e minimalismo | 3 | Leitura limpa com hairline; 3 linhas de controles empilhadas e âmbar cromático |
| 9 | Diagnóstico e recuperação | 2 | Alertas de semana/horário bons; erros de formulário só via toast e confirms nativos |
| 10 | Ajuda e documentação | 1 | Empty states guiam; badges "não configurado" sem link e "Semana da apostila" sem explicação |
| **Total** | | **22/40** | **Aceitável** |

## Design Specificity Verdict

**LLM assessment**: Parcialmente coerente, com fratura no meio. A superfície de *leitura* é genuinamente específica do domínio: a tabela de programação (horário tabular, cânticos, durações, rótulos de designação, seções com subtítulo) tem o ritmo de um programa impresso real — o "quadro de avisos" funcionando (meeting-schedule-table.tsx:7-55). O fluxo com filtro por privilégio ("Ninguém habilitado", meeting-section-card.tsx:38-47) é conhecimento de congregação real. Mas os três editores (MeetingsEditor, WatchtowerEditor, CatalogEditor) são CRUD genérico de data-entry: expõem `symbol`, `languageCode`, `coverImageUrl`, cor hex — jargão técnico para público não técnico. Pior: conteúdo padrão em espanhol num app PT-BR ("Cánticos", "Tesoros de la Biblia", tab `"es"` default em meetings-manager.tsx:53). Âmbar dos avisos viola a Regra do Silêncio Cromático (meeting-schedule-manager.tsx:388,397,440).

**Deterministic scan**: 1 achado (regra `broken-image`, warning) em `src/features/meetings/lib/jwpub.ts:639` — **falso positivo confirmado**: é literal de regex dentro do parser `parseCover`, não markup `<img>`. Superfície (8 páginas) e os 15 componentes: 100% limpos.

**Visual overlays**: pulados — nenhuma automação de navegador exposta nesta sessão.

## Overall Impression

A leitura é serena e específica; a autoria é genérica e administrativa. O melhor do produto está na tabela; os piores problemas estão nos editores (perda de foco ao digitar é bug real). Maior oportunidade: transformar a tela de programação de "planilha de 40 selects" para o fluxo "designar próxima" que o público não técnico aguenta no celular.

## What's Working

1. **Tabela de programação legível como documento real** — ritmo de 3 colunas consistente, dividers hairline, badges de dia/horário/total (meeting-schedule-table.tsx:7-55,82-88).
2. **Linha clicável com foco visível e affordance dupla** em content-list.tsx:78-121 — `focus-visible:ring-3`, ícones com aria-label, estado `deletingId` com spinner, empty state sensível a papel ("Entre em contato com um organizador").
3. **Candidatos filtrados por privilégio com placeholder honesto** — "Ninguém habilitado" (meeting-section-card.tsx:41-47) previne erro embutido no domínio.

## Priority Issues

**P1 — Perda de foco ao digitar nos editores (bug real).** Chaves de remount incluem o valor editado: `key={`${sectionKey}-${part.number}-${part.title}`}` (meetings-editor.tsx:374), `key={article.title}` (watchtower-editor.tsx:102), `key={`${item.number}-${index}`}` (catalog-editor.tsx:84). Digitar remonta o input e o cursor salta.
- **Why**: usuário não técnico conclui que o app está com defeito.
- **Fix**: chave estável (`sectionKey-index`).
- **Suggested command**: /impeccable harden

**P1 — IDs de checkbox duplicados por semana.** `id="opening-prayer"`/`"closing-prayer"` hardcoded em cada WeekCard (meetings-editor.tsx:324,421). Com todas as semanas abertas, `Label htmlFor` associa ao primeiro — clicar na etiqueta da semana 3 alterna a semana 1.
- **Why**: quebra acessibilidade e causa toggle errado.
- **Fix**: `useId()` por instância (padrão já usado em people-manager.tsx:164).
- **Suggested command**: /impeccable audit

**P1 — `DesignacoesTabs` sem sincronia de URL** (designacoes-tabs.tsx:14), enquanto o modelo `MembersTabs` persiste `?tab=` (members-tabs.tsx:31-34). Refresh/voltar reseta para "Reuniões"; a aba "Designações" não é deep-linkável.
- **Why**: o modelo de referência já definiu o padrão; a superfície quebra o botão voltar e a retomada de contexto.
- **Fix**: espelhar MembersTabs.
- **Suggested command**: /impeccable harden

**P1 — `window.confirm` para excluir apostila/Sentinela** (meetings-manager.tsx:213,229). Diálogo nativo sem marca e sem consequência, inconsistente com o Dialog do delete de semana e do PeopleManager.
- **Why**: destruição sem explicar impacto (programações podem referenciar a apostila) desmonta confiança.
- **Fix**: Dialog com lista de consequências, como people-manager.tsx:781-803.
- **Suggested command**: /impeccable harden

**P2 — Âmbar viola a Regra do Silêncio Cromático.** `text-amber-500`, `border-amber-500/30`, `bg-amber-500/5` (meeting-schedule-manager.tsx:388,397,440). A única cor cromática do sistema é o vermelho de erro; aviso não é erro.
- **Fix**: cinza + ícone de contorno, ou vermelho se bloqueante.
- **Suggested command**: /impeccable colorize

**P2 — Alvos de toque 32px e tipografia inconsistente.** `SelectTrigger h-8` (meeting-section-card.tsx:40,97) em scroll intenso no celular; `font-mono` nos horários (linha 78) sem correspondência na tabela de leitura (meeting-schedule-table.tsx:16) — segunda família fora do spec.
- **Fix**: h-9 mínimo e `tabular-nums` sans em ambos.
- **Suggested command**: /impeccable adapt

**P3 — Esqueleto de tabs divergente do modelo.** designacoes/loading.tsx:47-48 usa `rounded-lg`; membros/loading.tsx:71-73 usa `rounded-full` (tabs reais são pílulas).
- **Fix**: `rounded-full`.

**P3 — Navegação de semana tripla + leitura presa na semana atual.** WeekPicker tem chevrons + date input + select (week-picker.tsx:33-76), e o select some na aba fim de semana. A página Reuniões não tem navegador de semana (meeting-page.ts:86-101) — o secretário não confere a próxima semana sem entrar no editor.
- **Fix**: uma única navegação reutilizada nas duas superfícies.

## Persona Red Flags

**Alex (power user / o secretário)**: 3 controles redundantes de semana e tabs sem estado de URL — toda sessão recomeça no tab "Reuniões"; ~40 selects sem busca = horas de scroll; página Reuniões não mostra outras semanas sem entrar em edição.

**Jordan (primeira vez)**: ao importar, cai em "Editar apostila" com campos `symbol`, `Código de idioma`, `Imagem da capa` (URL), cor hex — jargão técnico nu (meetings-editor.tsx:90-135, watchtower-editor.tsx:213-218); conteúdo padrão em espanhol num app PT-BR (meetings-manager.tsx:53).

**Riley (stress test)**: excluir apostila referenciada passa por `window.confirm` sem consequência; sair de Programar descarta horas de trabalho silenciosamente; remounts corrompem entrada em massa.

**Sam (acessibilidade)**: IDs de checkbox duplicados quebram associação de labels; selects de 32px; swatches de cor 28px (watchtower-editor.tsx:203-208); avisos dependentes só de cor âmbar.

**Casey (mobile distraído)**: 3 linhas de controles empilhadas + "Salvar" no fim de scroll enorme — botão fora do alcance do polegar.

## Minor Observations

- `MeetingTabs` aplica `pt-4 space-y-4` nos contents; `DesignacoesTabs` não — espaçamento inconsistente.
- Empty states usam tile `bg-muted` + ícone muted (content-list.tsx:43-44) em vez do tile de assinatura (Preto Profundo 10%, DESIGN.md:177).
- Sombras sistêmicas: `shadow-sm` no Card/tab ativa, `shadow-xl` no Dialog, `shadow-xs` em inputs — a camada compartilhada viola a Regra do Flat Silencioso (herdado, afeta também Membros).
- `alert`/`window.confirm` x2 no meetings-manager mas Dialog em todo o resto do app.
- AssignmentsList renderiza o card "Fim de Semana" vazio quando só o meio de semana tem designações (assignments-list.tsx:97-101).
- `AlertTriangle` vermelho no diálogo de arquivo duplicado (meetings-manager.tsx:444) para estado não-destrutivo.
- "Excluir semana" (`ml-auto`, outline) compete com os badges informativos na mesma linha (meeting-schedule-manager.tsx:336-348).
- `max-w-4xl` (896px) em todas as páginas vs `max-w-sm` do DESIGN.md:132 — desvio compartilhado com Membros.
- `designacoes-tabs.tsx` e `meeting-tabs.tsx` são wrappers quase idênticos — consolidar.

## Questions to Consider

1. Se o secretário programa no celular, no salão, por que a tela de atribuição é um scroll de 40 selects sem busca nem "designar próxima"? O modelo mental atual é a planilha de papel, não o quadro de avisos — os dois princípios brigam na mesma tela.
2. "Editar apostila" expõe `symbol`, `languageCode` e cor hex: de quem é esse trabalho? Se é do importador, por que a UI o oferece a um ancião de 60 anos?
3. O espanhol padrão existe porque o dado .jwpub é espanhol — mas a persona fala português. O app deveria definir idioma por congregação antes de qualquer edição, ou a mistura é o custo aceito de priorizar o dado sobre o usuário?
