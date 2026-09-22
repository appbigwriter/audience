# HANDOFF — Track B Audience Builder — 2026-09-22

- **Task:** FBR-BLOGS-PLAN-20260921-002
- **Track:** B — produto, UI, design system, templates, editorial, social e dashboards
- **Provider/modelo:** fallback OpenAI Codex / GPT-5.6-luna-900k
- **Estado:** `PARCIALMENTE_VALIDADO_LOCALMENTE — NÃO LIBERADO PARA PRODUÇÃO`
- **Pergunta de revisão:** “Esse recurso corresponde exatamente ao que o sistema necessita?”

## 1. Base lida e escopo preservado

Foram lidos antes da execução: `01-conceitual/README.md`, `02-prd/SPRINTS-STORIES-AUDIENCE-BUILDER.md`, `02-prd/STATUS-AUDIENCE-BUILDER.md`, `08-historico/agents/MP-000-audience-builder-foundation.md`, `08-historico/agents/MATRIZ-CONVERGENCIA-AB-S1-001-2026-09-22.md`, `08-historico/REVIEW-INDEPENDENTE-AUDIENCE-BUILDER-2026-09-22.md` e o handoff do Track A.

Ownership preservado: `09-codigo/apps`, `packages/design-system`, `packages/template-engine`, `packages/editorial-ui`, `packages/social-ui`, `tests/ui`, `tests/visual` e este handoff em `08-historico/agents`. Nenhum path exclusivo do Track A foi alterado; não houve alteração de status do coordenador.

## 2. Auditoria do parcial e correções aplicadas

O parcial existente já continha lógica local extensa para S3, S4, S5, S6 e S9, mas não tinha uma superfície integrada local que compusesse esses contratos nem handoff formal. A revisão encontrou e corrigiu:

- dashboard de portfólio podia marcar produção verificada com apenas uma integração `verified`; agora exige projeto `active`, sem blockers, e todas as integrações presentes verificadas;
- relatório do wizard ordenava `state.combos` in-place; agora preserva a ordem/estado de entrada;
- detalhe do gate de fixture agora distingue fixture test-only de ausência de fixture;
- criada superfície integrada determinística e acessível, com preview, calendário, descoberta social, dashboard e health/portfolio; sem persistência, provider call ou publicação.

## 3. Stories e aceite

| Story | Resultado | Aceite/evidência |
|---|---|---|
| AB-S3-001 | **parcialmente atendida / validada local** | Theme Manifest, tokens, presets, contraste, origem/versionamento e CSS variables existentes; testes passam. Preview integrado na nova surface. Não há browser editor/persistência real. |
| AB-S3-002 | **parcialmente atendida / validada local** | Resolução template → nicho → Persona, allowlist e warnings testados. |
| AB-S3-003 | **parcialmente atendida / validada local** | Registry/versionamento/depreciação/compatibilidade testados. |
| AB-S3-004 | **parcialmente atendida / validada local** | Renderer determinístico, homepage/article/category, estados vazios, landmarks e desktop/mobile por representação; sem browser integrado. |
| AB-S3-005 | **validada localmente** | Catálogo com schemas/variantes/compatibilidade coberto por `tests/ui/template-engine.test.ts`. |
| AB-S3-006 | **parcialmente atendida / validada local** | Editor controlado ordena blocos, altera variantes, viewport, salva/restaura draft; não publica automaticamente. Persistência/readback real pendentes. |
| AB-S3-007 | **validada localmente como checks** | Assinaturas determinísticas, baseline, contraste AA, landmarks e foco/label cobertos em `tests/visual/visual-regression.test.ts`; não substitui screenshot/browser QA. |
| AB-S4-001 | **validada localmente** | Perfil derivado da Persona, binding/hash e allowlist testados. |
| AB-S4-002 | **validada localmente** | Calendário com pauta, owner, data, canal, status, prioridade, filtros e transições; sem publicação automática. |
| AB-S4-003/004 | **validadas localmente** | Briefing, fontes, citações e claim support com blocker de fonte ausente. |
| AB-S4-005/006/007 | **validadas localmente** | Draft, contagem, fact-check, claims e SEO review; SEO não aprova fatos/publicação. |
| AB-S4-008/009 | **validadas localmente** | Asset rights, alt text, dimensões, peso, legibilidade e blockers de media QA. |
| AB-S5-001/002 | **validadas localmente** | Capability map versionado/provenance, formatos, limites, custos, requisitos e bloqueio sem contrato oficial. |
| AB-S5-003/004/005 | **validadas localmente** | Adequação data-driven, hipóteses, incertezas, dados faltantes e comparação versionada. Nenhum canal é escolhido automaticamente. |
| AB-S5-006/007/008 | **validadas localmente** | Channel Plan, variantes, disclosure, approval package e Gate Sergio; publicação permanece bloqueada. |
| AB-S5-009 | **validada localmente** | Apenas métricas verified-readback alteram hipóteses; histórico não é mutado. |
| AB-S6-006 | **parcialmente atendida / validada local** | Cards distinguem real/estimate/missing/stale e filtros funcionam; nova surface compõe o bloco, porém não há dados/readback reais. |
| AB-S8-005 | **parcialmente atendida / validada local** | Surface integrada determinística cobre design/editorial/social/dashboard/health e HTML acessível; não é QA visual de browser nem screenshot real. |
| AB-S9-003 | **parcialmente atendida / validada local** | Health row model cobre status, jobs, blockers, integrações, métricas, última ação e próximo check; surface exibe os dados localmente. Monitoramento/processos reais pendentes. |
| AB-S9-005 | **validada localmente com correção** | Portfolio buckets separados; produção verificada agora exige todos os readbacks/integrations verificadas e ausência de blockers. |

Stories S6-001..005, S7, S8-001..004/006..008 e S9-001/002/004/006 não foram reimplementadas neste Track B; o que existe no workspace foi tratado como dependência/entrega do Track A ou parcial, conforme handoffs e matriz.

## 4. Arquivos alterados nesta reexecução

- `09-codigo/apps/audience-builder/src/surface.ts` — novo compositor local integrado e HTML acessível determinístico.
- `09-codigo/apps/audience-builder/src/index.ts` — export da surface.
- `09-codigo/apps/audience-builder/src/dashboards.ts` — correção de critério de produção verificada.
- `09-codigo/apps/audience-builder/src/discovery-wizard.ts` — ordenação sem mutação do estado.
- `09-codigo/apps/audience-builder/src/readiness.ts` — detalhe correto sobre fixture.
- `09-codigo/tests/ui/audience-builder-app.test.ts` — smoke/contrato da superfície integrada.

Os demais arquivos de `packages/design-system`, `template-engine`, `editorial-ui`, `social-ui`, `tests/ui` e `tests/visual` já estavam presentes como parcial do Track B e foram auditados/reexecutados; não foram reescritos nesta passagem.

## 5. Verificação executada

Diretório: `F:\Projetos\_FBR\FBR Blogs\09-codigo`

- `npm test -- --run tests/ui/audience-builder-app.test.ts tests/ui/design-system.test.ts tests/ui/template-engine.test.ts tests/ui/editorial-ui.test.ts tests/ui/social-ui.test.ts tests/visual/visual-regression.test.ts` — **6 arquivos / 105 testes PASS**.
- `npm run typecheck` — **PASS, exit 0**.
- `npm test` — **PASS** (suíte completa; saída concluída sem erro).
- `npm run lint` — **PASS, exit 0**.
- `npm run build` — **PASS, Next.js build concluído**.
- `git diff --check` — **PASS**.
- Smoke de superfície — incluído em `tests/ui/audience-builder-app.test.ts`: **sections design/editorial/social/dashboard/health**, preview com landmark `main`, social explicitamente TBD e publicação sem automação — **PASS**.

## 6. Classificação de integração

- **Lógica local verificada:** tokens, template registry/renderer/editor, visual signatures/contrast, calendário, research/SEO/media QA, capability map/recomendação, channel plans/variants/approval, dashboard cards/filters, health/portfolio e compositor de surface.
- **UI integrada local:** superfície HTML determinística em `apps/audience-builder/src/surface.ts`, exercitada por Vitest; não é uma rota/browser surface persistida.
- **Fake/test-only:** fixtures de Persona, catálogos locais e dados de testes; nunca evidenciam produção.
- **Pending externo:** Authority API/persona readback, outbox assinado, service auth, registro de derivados, Control Tower/Flux readback, Postgres/RLS/runtime auth, social provider contracts/accounts, métricas reais, browser screenshot/regression e monitoramento operacional.

## 7. Blockers e divergências

1. MP-000 do Audience Builder continua `draft/em_validacao`; não aprovado por Sergio.
2. Authority B1–B4 continuam sem contrato/readback oficial.
3. Migrations 001/002 não foram aplicadas remotamente; RLS não verificado em runtime.
4. A superfície integrada é local e determinística; não deve ser descrita como UI de produção, persistência ou integração real.
5. QA visual ainda é representacional por HTML/hash/contraste; screenshot/browser e responsividade real permanecem pendentes.
6. Social permanece **TBD/data-driven**; nenhuma seleção automática, publicação, conta, secret ou gasto foi executado.
7. Não houve deploy, publicação, gasto, criação de conta social, migration remota ou manipulação de secrets.

## 8. Próximas ações

1. Obter aprovação humana do MP-000 específico.
2. Fechar B1–B4 do Authority e substituir fixtures por adapter oficial com readback.
3. Integrar a surface a uma rota/browser controlada sem criar persistência paralela; adicionar browser smoke desktop/mobile.
4. Conectar dashboard/calendar/approval a repositório contratual do Track A, com readback e isolamento tenant.
5. Validar Control Tower/Flux, RLS, health operacional e métricas reais somente após Gates.
6. Reexecutar review independente por Story; apenas então promover qualquer Story a `concluido_validado`.

**Conclusão:** Track B possui núcleo UI/design/social local exercitado e gaps corrigidos, mas permanece parcial e não está pronto para produção.
