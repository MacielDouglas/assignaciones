# Critique — Membros (2ª execução)

**Target:** `src/app/dashboard/membros/page.tsx` + componentes (members-tabs, members-manager, tokens-manager, people-manager, loading)
**Data:** 2026-08-20 · **Score:** 13/40 (Needs work) · **Trend:** 24 → 13

## Contexto
Correções de harden/clarify/distill/layout foram aplicadas desde a 1ª execução. As áreas corrigidas estão sólidas (diálogos de confirmação completos, vocabulário consistente, form em modal, labels corretos). O score caiu porque as correções introduziram regressões (parser de tab restrito que quebra o skeleton, fetch cru pós-save, state trap novo via "Marcar todos") e a nova estrutura de abas expôs lacunas de deep-link/estado.

## O que está funcionando bem (manter)
1. Todas as ações destrutivas (papel, remover convite, excluir pessoa) têm diálogo com consequência específica + undo real no toast.
2. Cromatismo silencioso respeitado (status de convite tudo `secondary`; vermelho só no destrutivo).
3. Rotulagem disciplinada: `useId` nos checkboxes, `htmlFor`/`id` em todos os selects, `aria-label` em todos os botões de ícone.
4. Form condicional progressivo (estudante → homem → batizado → privilégios) com grupos "Marcar todos/Limpar".
5. Linhas responsivas com `min-w-0` + `truncate` + ações `shrink-0`; bottom-sheet ↔ modal via `sm:`.

## P1 — Corrigir (9 · peso 2)

| # | Problema | Local | Fix |
|---|----------|-------|-----|
| 1 | Aba "Irmãos" não é deep-linkável: `page.tsx` e `loading.tsx` só aceitam `pessoas`/`convites`; `?tab=irmaos` cai em Pessoas, `?tab=tokens` mostra skeleton de Pessoas; trocar de aba não atualiza a URL (refresh/voltar perde a aba) | `membros/page.tsx:35-40`, `loading.tsx:58`, `members-tabs.tsx` | Aceitar `"irmaos"` no parser (page e loading) e sincronizar a aba com `router.replace` usando a URL como fonte de verdade |
| 2 | Admin vendo o OWNER: o Select de papel só tem itens `[ADMIN, MEMBER]`; com um membro `OWNER` na lista o trigger renderiza vazio (Radix sem item para o value) — parece quebrado e o admin pode tentar rebaixar (proteção só no back-end) | `members-manager.tsx:62-64,134-152` | Quando `member.role` não estiver em `allowedRoles`, desabilitar o Select e exibir o papel como texto estático |
| 3 | State trap novo: "Marcar todos" de Informações gerais marca `jovem` **e** `casado` ao mesmo tempo; como `casado` fica `disabled` quando `jovem`, o usuário fica preso com estado contraditório e imutável | `people-manager.tsx:481-495,529-540` | Ao marcar `jovem`, forçar `casado=false`; excluir `casado` do toggle em massa; manter o helper só quando o conflito é possível |
| 4 | Excluir pessoa com conta vinculada (`member`) ou cônjuge (`spouse`/`marriedTo`) não avisa: o usuário perderá o acesso e o vínculo de casamento some | `people-manager.tsx:693-697` | No diálogo, detectar `member`/`spouse` e exibir aviso específico |
| 5 | Formulário de convite: selecionar família E digitar "criar nova família" envia ambos sem resolução no cliente (PeopleManager resolve: nome novo vence) — inconsistência entre os dois formulários | `tokens-manager.tsx:287-311` | Resolver no cliente como no PeopleManager ou desabilitar o select quando o input tiver texto |
| 6 | `fetch("/api/tokens")` pós-ação fora de try/catch: falha de rede vira unhandled rejection; resposta 5xx com corpo de erro passa a `setTokens(data)` e quebra o render em `STATUS_LABEL[token.status]` | `tokens-manager.tsx:165-170` | Usar `apiFetch<TokenRow[]>` dentro de try/catch com `toast.error`, como já feito no `createOrganizationToken` |
| 7 | `fetch` cru pós-salvar pessoa sem checar `response.ok`: corpo de erro vira estado `people` e o `grouped` quebra em `person.familia.name`; falha de rede deixa a lista obsoleta (o `useState(initialPeople)` ignora props novas do refresh) | `people-manager.tsx:360-362` | `apiFetch<PersonRow[]>` + checagem de `response.ok`; ou depender do `router.refresh()` |
| 8 | Código de convite gerado se perde ao trocar de aba: o Radix desmonta a aba Convites (sem `forceMount`); "não será mostrado novamente" e o card "Convite gerado" somem | `tokens-manager.tsx:86`, `members-tabs.tsx:41-43` | Persistir o código em `sessionStorage` ou elevá-lo ao contexto de `MembersTabs` |
| 9 | Contraste das abas inativas reprova AA: `text-muted-foreground` sobre `bg-muted` ≈ 4,1:1 (claro) e 4,4:1 (escuro); 14px exige 4,5:1 | `tabs.tsx:17` | `text-foreground/60` no `TabsList` (≈4,9:1 em ambos) |

## P2 — Polir (9 · peso 1)

| # | Problema | Local | Fix |
|---|----------|-------|-----|
| 10 | Skeleton dos Irmãos tem avatar circular que não existe na linha real e mostra 1 box com 5 linhas em vez de Cards individuais; skeleton de Convites mostra 1 card, a tela real tem 2–3 | `loading.tsx:3-19,74-83` | Espelhar cards/linhas reais (sem avatar; cards de convite/administrador) |
| 11 | "Marcar todos" de Informações gerais nunca vira "Limpar" (inconsistente com os grupos de privilégios); Badge + Select duplicam o papel na linha de irmãos; espaçamento de cards difere entre tabs (`space-y-2` vs `space-y-6`) | `people-manager.tsx:495`, `members-manager.tsx:133,108` | Alternar "Marcar todos/Limpar"; remover o badge ou o select; padronizar `space-y-6` |
| 12 | `copyToken` não trata falha do clipboard (toast "Código copiado!" mente); "Renovar" sem estado in-flight (toque duplo = 2 renovações/toasts) | `tokens-manager.tsx:172-176,145-163` | `try/catch` no copy; `renewingId` + `disabled` no botão |
| 13 | Para subUser, "Convidar administrador do sistema" (raro) vem antes de "Convidar irmão" (principal); `aria-label` de convite de organização é genérico ("Remover convite de membro") | `tokens-manager.tsx:199-213,360,369` | Inverter a ordem; usar "Criação de organização" no label |
| 14 | Diálogos: auto-rebaixamento do OWNER não avisa que ele pode deixar a organização sem owner; fechar o modal do form (overlay/ESC/bottom-sheet) descarta dados sem confirmação | `members-manager.tsx:159-187`, `people-manager.tsx:401-408` | Avisar quando alvo = usuário atual; confirmar descarte quando o form está sujo |
| 15 | A11y fina: sem `prefers-reduced-motion` no Dialog/Select; `aria-label` do select de papel esconde o valor atual do leitor; abas `h-8` e "Marcar todos" `h-7` abaixo de 44px; Dialog do form sem `DialogDescription`/`autoFocus` | `dialog.tsx`, `select.tsx`, `members-manager.tsx:141`, `tabs.tsx:30`, `people-manager.tsx:200,412` | `motion-reduce:animate-none`; `aria-label` com papel atual; `h-9`+; descrição breve + foco no Nome |
| 16 | Toast "Desfazer" de papel obsoleto: continua clicável após segunda mudança e reverte para papel antigo | `members-manager.tsx:78-95` | Invalidar/desabilitar quando o papel mudar de novo |
| 17 | GET de tokens do owner não inclui `organization`/`createdBy`: após qualquer `refresh()`, "· {nome da organização}" some silenciosamente | `api/tokens/route.ts:197-220` | Incluir `organization` no GET de owners |
| 18 | Nomes longos em pessoas não truncam (`flex flex-wrap` empurra o status); grids de checkbox `grid-cols-2` espremem labels em 320px; bottom-sheet sem `safe-area-inset` (inputs cobertos no iOS) | `people-manager.tsx:636,210,498`, `dialog.tsx:55` | `truncate` + `title`; `min-[380px]:grid-cols-2`; `env(safe-area-inset-bottom)` |

## Plano sugerido
- **harden** (P1 2,3,4,5,6,7 + P2 12,14,16): guarda-rails e confiabilidade de rede
- **clarify** (P1 4,5 + P2 11,13): avisos de consequência e vocabulário
- **distill** (P1 3,5 + P2 11,16): estado e consistência de formulários
- **layout+audit** (P1 1,8,9 + P2 10,15,17,18): deep-link, skeleton, contraste, a11y

Sem commit automático.