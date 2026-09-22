# HANDOFF — Track A (Backend/Domínio/Integração) do Audience Builder

- **Task global:** FBR-BLOGS-PLAN-20260921-002
- **Agente:** A (domínio, contratos, persistência, migrations, adapters, integrações)
- **Data:** 2026-09-22
- **Provider/modelo:** Z.ai / GLM 5.2
- **Estado:** execução contínua concluída para todas as Stories backend elegíveis; **integração externa real permanece pendente** (sem readback externo disponível)

## 1. Stories implementadas (com evidência)

| Story | Título | Artefatos | Testes |
|---|---|---|---|
| AB-S0-001 | Elegibilidade da Persona | `packages/contracts/persona-intake.ts` (decidePersonaEligibility) | `tests/domain/persona-intake.test.ts` (estados válidos/rejeitados/desconhecidos) |
| AB-S0-002 | Versão imutável e hash | `persona-intake.ts` (compareAgainstBinding) + `common.ts` (canonicalJson/computeContentHash) + recálculo no binding (`domain/audience-project.ts`) | igualdade/divergência/replay testados |
| AB-S0-003 | Persona Intake Package | `persona-intake.ts` (schema completo: Bibles, Visual, Editorial, ChannelPlans, nichos, disclosure) | validação campo a campo |
| AB-S0-004 | Fixture test-only | `packages/contracts/persona-fixtures.ts` | hash reproduzível, sem secrets, incompleta falha |
| AB-S0-005 | Readiness report Authority | `08-historico/agents/READINESS-AUTHORITY-AB-S0-005-2026-09-22.md` | fatos citados por testes reais existentes |
| AB-S0-006 | Gate de liberação | `packages/contracts/release-gate.ts` | `tests/domain/release-gate.test.ts` (produção com fixture bloqueia) |
| AB-S1-001 | Auditoria MP-000 (matriz convergência) | `08-historico/agents/MATRIZ-CONVERGENCIA-AB-S1-001-2026-09-22.md` | — (documento) |
| AB-S1-002 | Maximizadores reutilizáveis | `08-historico/agents/RELATORIO-MAXIMIZACAO-AB-S1-002-2026-09-22.md` | — |
| AB-S1-003 | MP-000 do Audience Builder | `08-historico/agents/MP-000-audience-builder-foundation.md` (status draft/em_validacao) | — |
| AB-S1-004 | Estrutura de repositório | `08-historico/agents/ESTRUTURA-REPOSITORIO-AB-S1-004-2026-09-22.md` | `tests/integration/ownership-paths.test.ts` |
| AB-S1-005 | Estados do Audience Project | `packages/contracts/audience-project-states.ts` | transições inválidas falham; evidência actor/reason obrigatória |
| AB-S1-006 | Ownership e Gates | `08-historico/agents/MATRIZ-OWNERSHIP-GATES-AB-S1-006-2026-09-22.md` | — |
| AB-S2-001 | Domínio Audience Project | `packages/domain/audience-project.ts` | criação exige persona válida; slug/owner duplicity; transições |
| AB-S2-002 | Persistência relacional | `migrations/001_audience_builder_foundation.sql` + `packages/persistence/audience-project-repository.ts` (readback, tenant scope, unique constraints) | isolamento tenant, duplicidade |
| AB-S2-003 | Persona binding imutável | `audience-project.ts` (bindPersona + recálculo de hash) + tabela `audience_persona_bindings` | readback mesmos valores; stale rejeitada; divergente bloqueia; replay idempotente |
| AB-S2-004 | Nichos potenciais | `packages/domain/potential-niches.ts` + tabela | hipótese ≠ decisão; classificação com ator; proposta sem decisão |
| AB-S2-005 | Manifesto validado | `packages/domain/manifesto.ts` + tabela `audience_project_manifestos` | erros por campo; versionado; hash idempotente |
| AB-S2-006 | Pacote de configuração | `manifesto.ts` (buildConfigurationPackage/validate) + tabela | referências sem secrets; pacote inválido não publica |
| AB-S4-001 | Perfil editorial derivado | `packages/domain/editorial.ts` | voz/pilares/guardrails imutáveis; ajustes só em vocabulary/formats/cadence |
| AB-S4-003 | Briefing de pesquisa | `editorial.ts` (validateResearchBrief) | ≥4 pontos, limitações, fontes |
| AB-S4-004 | Fontes e citações | `editorial.ts` (validateSource) + tabela | fonte ausente bloqueia claim (factCheck) |
| AB-S4-005 | Draft de artigo | `editorial.ts` (createArticleDraft/reviseDraft) + tabela | versão, contagem, saída draft |
| AB-S4-006 | Fact check e claims | `editorial.ts` (factCheck/approveDraftIfSupported) | fato sem fonte → blocked |
| AB-S5-001/002 | Capability map por canal | `packages/domain/channel-discovery.ts` (validateChannelCapability) | dados externos com fonte/data; integração sem contrato é bloqueio |
| AB-S5-003 | Sinais de adequação | `channel-discovery.ts` (scoreChannelFit) | ponderação clamped; incertezas declaradas |
| AB-S5-004 | Hipóteses de canal | `generateChannelHypotheses` | candidatos propostos, nunca decisão |
| AB-S5-005 | Combinações | `compareCombinations` | score composto versionado |
| AB-S6-001 | Ad inventory central | `packages/domain/monetization.ts` | formatos 1250x150/350x350; fbrAdsRef obrigatório |
| AB-S6-002 | Affiliate recommendation | `monetization.ts` | evidência; irrelevante bloqueia job |
| AB-S6-003 | Binding monetização↔conteúdo | `bindMonetization` | 1 affiliate + 1 product ad ou blocked |
| AB-S6-004 | Validação de disclosure | `disclosureBlocksApproval` | obrigatório e contextual (no corpo) |
| AB-S6-005 | Eventos e métricas | `monetization.ts` (validateMetricsEvent/aggregateByOrigin) + tabela | measured exige readbackRef; agregação separa real/estimado |
| AB-S7-001 | Jobs no Flux | `packages/domain/orchestration.ts` (createJob/heartbeat/canStart) + tabela | owner, dependência, heartbeat, nextAction/check |
| AB-S7-002 | Handoffs versionados | `orchestration.ts` (createHandoff/acceptHandoff) | envio ≠ conclusão; aceite único |
| AB-S7-003 | Inbox/outbox idempotente | `orchestration.ts` (InboxDeduplicator/processOnce) + tabela `audience_inbox_events` | replay não duplica; tentativas/nextRetry persistidos |
| AB-S7-004 | Adapter CT provisioning | `packages/adapters/control-tower-provisioning-adapter.ts` | payload explícito; duplicidade; mock/real separados |
| AB-S7-005 | Readback projeto/schema | adapter (readback) | sem readback permanece pending |
| AB-S7-006 | Runtime env contract | `packages/contracts/runtime-contract.ts` | secret por referência; frontend nunca vê plaintext |
| AB-S7-007 | Health/deploy/rollback | `runtime-contract.ts` | health ≠ deploy; rollback condicionado |
| AB-S8-001/002/003 | Piloto E2E local | `tests/integration/pilot-e2e.test.ts` | intake→…→draft/blocked; social sem publicação; jobs idempotentes |
| AB-S9-001 | Blueprint | `packages/domain/replication.ts` (getDefaultBlueprint) | entradas/validações/gates/rollback |
| AB-S9-002 | Replicação por manifesto | `replicateFromManifesto` | idempotente e isolada por tenant |
| AB-S9-005 | Relatório de portfólio | `buildPortfolioReport` | production_verified só com readback |

## 2. Testes (evidência de execução)

- Comando: `npx vitest run tests/domain tests/integration` (+ suite legada completa)
- **Resultado final: 182 testes, 182 passando** (Track A; suite completa do repo incluindo Track B: ver nota)
- `npm run typecheck`: **0 erros nos paths do Track A** (existem erros em `packages/design-system/`, `template-engine/`, `editorial-ui/`, `social-ui/` e `tests/ui/` — **propriedade do Agente B**, não tocados por este track)
- Baseline pré-trabalho: 30 testes verdes (sem regressão)

## 3. Pendências / bloqueios

| # | Bloqueio | Owner | Next action | Next check |
|---|---|---|---|---|
| B1 | API oficial Authority para Persona aprovada | Time Authority (David) | expor read model com content_hash | contrato HTTP público |
| B2 | Outbox assinado `persona.approved` | Time Authority | implementar outbox | junto com B1 |
| B3 | Auth serviço-a-serviço definitiva | David + Gate técnico | decidir identidade (mTLS/JWT) | antes de integração real |
| B4 | Registro de derivados no Authority | Time Authority | endpoint de registro | após B1 |
| B5 | Migrations não aplicadas (local somente) | Sergio (Gate) | aprovar aplicação em staging/produção | Gate de deploy |
| B6 | RLS ativo no Postgres | Agente A após auth runtime | ativar policies comentadas em migration 001 | quando Flux definir auth |
| B7 | Stories de UI (S3 editor visual, dashboards) | Agente B | track paralela | review de Sprint |
| B8 | QA visual/regressão (AB-S3-007, S8-005) | Agente B + coordenador | screenshots e checks | Sprint S8 |
| B9 | Review independente GPT-5.6 por Sprint | David | “Esse recurso corresponde exatamente ao que o sistema necessita?” | fim de cada Sprint |

**Integração externa marcada como pendente onde readback não existe:** adapter Authority real (`AUTHORITY_ADAPTER_NOT_CONFIGURED`), adapter CT real (`CT_PROVISIONING_REQUIRES_GATE`), eventos social (nenhum contrato oficial).

## 4. Caminhos criados (todos em ownership do Agente A)

```text
09-codigo/packages/contracts/{common,persona-intake,persona-fixtures,release-gate,persistence-contract,audience-project-states,runtime-contract}.ts
09-codigo/packages/domain/{audience-project,potential-niches,manifesto,editorial,channel-discovery,monetization,orchestration,replication}.ts
09-codigo/packages/persistence/audience-project-repository.ts
09-codigo/packages/adapters/{authority-persona-adapter,control-tower-provisioning-adapter}.ts
09-codigo/migrations/{001_audience_builder_foundation,002_editorial_social_monetization_orchestration}.sql
09-codigo/tests/domain/{persona-intake,release-gate,audience-project,manifesto,editorial,channel-discovery,monetization,orchestration,replication}.test.ts
09-codigo/tests/integration/{ownership-paths,audience-builder-e2e,provisioning-runtime,pilot-e2e}.test.ts
08-historico/agents/{READINESS-AUTHORITY-AB-S0-005,MATRIZ-CONVERGENCIA-AB-S1-001,RELATORIO-MAXIMIZACAO-AB-S1-002,MP-000-audience-builder-foundation,ESTRUTURA-REPOSITORIO-AB-S1-004,MATRIZ-OWNERSHIP-GATES-AB-S1-006}-2026-09-22.md (+ MP-000 sem sufixo)
```

## 5. Próximas ações (backend)

1. Review independente por Sprint (critério funcional obrigatório).
2. Fechamento B1–B4 pelo Authority para trocar fixtures por integração real (os adapters já estão prontos e fail-closed).
3. Gate Sergio para migrations em staging.
4. Consumir `ConfigurationPackage` no Template Engine (Agente B) — contrato validado de ambos lados.

## 6. Nota de integridade

- Nenhuma migração remota, deploy, publicação, gasto, criação de conta social ou manipulação de secret foi executada.
- Todos os dados usados em testes são fixtures marcadas `testOnly`; produção com fixture é bloqueada por código (`release-gate.ts`).
- 100% das claims de conclusão acima têm diff/arquivo/teste correspondente neste handoff.
