# Tasklist de Execução Autônoma — Audience Builder

**Card:** `AB-TASKLIST-EXECUCAO-AUTONOMA-20260922-001`  
**Data:** 2026-09-22  
**Status:** `PLANEJAMENTO_EXECUTIVO — PRONTO_PARA_EXECUCAO_AUTONOMA`  
**Fonte de Dados e Infraestrutura:** [audience-dev-doc (1).md](file:///f:/Projetos/_FBR/FBR%20Audience/02-prd/audience-dev-doc%20(1).md)  
**Fonte Conceitual e de Domínio:** [PROJETO-CONCEITUAL-AUDIENCE-BUILDER.md](file:///f:/Projetos/_FBR/FBR%20Audience/02-prd/PROJETO-CONCEITUAL-AUDIENCE-BUILDER.md)  
**Backlog de Stories:** [SPRINTS-STORIES-AUDIENCE-BUILDER.md](file:///f:/Projetos/_FBR/FBR%20Audience/02-prd/SPRINTS-STORIES-AUDIENCE-BUILDER.md)

---

## 1. Identidade e Parâmetros Canônicos do Sistema

| Parâmetro | Valor Canônico |
|---|---|
| **Project ID** | `153d40a6-5823-4029-add3-b52604cd3b71` |
| **Slug** | `audience` |
| **Tipo / Template** | `custom` / `custom_base` (v1.0.0) |
| **Schema Exclusivo** | `custom_audience` (proibido usar `public` ou outro schema) |
| **Namespace Control Tower** | `fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71` |
| **Domínio Oficial** | `https://audience.fbr.news` |
| **Endpoint de Health** | `https://audience.fbr.news/health` (Porta `3400`, Host `0.0.0.0`) |
| **Target / Hospedagem** | `vps2` (Easypanel `sistemas` / serviço `audience`) |
| **Repository Path** | `/09-codigo` |

---

## 2. Gaps e Problemas Identificados para Operação 100% Funcional

1. **Schema de Banco de Dados Desalinhado:**  
   Arquivos legados referenciam `custom_fbr_blogs`. O runtime oficial exige operação estrita no schema `custom_audience`, contendo tanto as **7 tabelas de governança padrão do Control Tower** (`entities`, `entity_relations`, `records`, `files`, `settings`, `audit_logs`, `events`) quanto as **tabelas de domínio do Audience Builder** (bindings, projetos, manifestos, editorial, social, ads, jobs, inboxes).
2. **Camada de Persistência Supabase / Postgres:**  
   O código atual possui testes locais com fixtures, mas precisa do cliente relacional transacional ativo consumindo `DATABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com preflight `SELECT 1` e tratamento de erros sem vazamento de secrets.
3. **Endpoint de Health & Observabilidade:**  
   O `/health` precisa executar verificação de conectividade com o banco, validar se o schema `custom_audience` está provisionado e retornar status HTTP 200 detalhado.
4. **Governança de Tokens Authority:**  
   Camada de middleware para autenticar chamadas via `AUTHORITY_ADMIN_TOKEN`, `AUTHORITY_OPERATOR_TOKEN`, `AUTHORITY_REVIEWER_TOKEN`, `AUTHORITY_PUBLISHER_TOKEN` e `AUTHORITY_VIEWER_TOKEN`.
5. **Automação de Jobs do Agency Flux:**  
   Inbox e Outbox idempotentes para processar eventos do fluxo sem duplicação e registrar readbacks.
6. **Deploy Standalone / Container:**  
   Dockerfile e runtime preparados para Next.js Standalone na porta 3400.

---

## 3. Grafo de Fases para Execução Autônoma

```text
[FASE 1: BANCO & SCHEMA] -> [FASE 2: CLIENT DB & HEALTH] -> [FASE 3: TOKENS & RBAC]
            |                               |                             |
            v                               v                             v
[FASE 4: INGESTÃO PERSONA] -> [FASE 5: MOTORES & TEMPLATES] -> [FASE 6: SOCIAL & MONETIZAÇÃO]
            |                               |                             |
            +-------------------------------+-----------------------------+
                                            v
                              [FASE 7: ORQUESTRAÇÃO FLUX]
                                            v
                              [FASE 8: SMOKE & TESTES E2E]
                                            v
                              [FASE 9: STANDALONE & DEPLOY]
```

---

## 4. Tasklist Detalhada por Fases

### FASE 1 — Banco de Dados, Schema `custom_audience` e Governança
- [ ] **TASK-01.1:** Criar a migration consolidada `001_custom_audience_governance_and_domain.sql` garantindo:
  - `CREATE SCHEMA IF NOT EXISTS custom_audience;`
  - 7 tabelas de governança: `entities`, `entity_relations`, `records`, `files`, `settings`, `audit_logs`, `events`.
  - Tabelas de domínio com isolamento `tenant_id`/`project_id`:
    - `audience_projects` (status, version, slug, metadata)
    - `audience_persona_bindings` (persona_id, version, content_hash, snapshot)
    - `audience_project_transitions` (auditoria de transições)
    - `audience_manifests` (configuração versionada)
    - `audience_potential_niches` (hipóteses e limitações)
    - `audience_editorial_profiles` & `audience_editorial_jobs` & `audience_editorial_drafts`
    - `audience_editorial_sources` & `audience_editorial_claims`
    - `audience_media_assets` (licença, prompt, dimensões, alt text)
    - `audience_channel_plans` & `audience_channel_variants` & `audience_social_approval_packages`
    - `audience_ad_inventory` (FBR Ads 1250x150 e 350x350)
    - `audience_analytics_events` (métricas verificáveis)
    - `audience_flux_jobs`, `audience_inbox_events`, `audience_outbox_events`
- [ ] **TASK-01.2:** Adicionar constraints de unicidade, chaves estrangeiras, índices e RLS (Row Level Security) para proteger dados por projeto/tenant.
- [ ] **TASK-01.3:** Atualizar `04-database/schema.sql` e documentar a estrutura canônica.

---

### FASE 2 — Runtime, Conexão com Supabase/PostgreSQL e Health Check
- [ ] **TASK-02.1:** Implementar módulo de persistência relacional (`lib/db.ts` ou `packages/persistence`) capaz de operar via `DATABASE_URL` (pool PostgreSQL) ou `@supabase/supabase-js` com service role key.
- [ ] **TASK-02.2:** Configurar validação de variáveis de ambiente no startup (`lib/env.ts`):
  - Validar `CONTROL_TOWER_PROJECT_ID`, `CONTROL_TOWER_SCHEMA_NAME`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `HOST`.
  - Proibir valores inseguros (`localhost`, `127.0.0.1` em produção).
- [ ] **TASK-02.3:** Atualizar rota `/health` (`app/health/route.ts`):
  - Executar preflight `SELECT 1` no banco.
  - Verificar existência do schema `custom_audience`.
  - Retornar payload estruturado com status HTTP 200, uptime, tenant e flags de serviço sem expor credenciais.

---

### FASE 3 — Autenticação, RBAC e Tokens do Authority Engine
- [ ] **TASK-03.1:** Implementar middleware de autenticação (`lib/auth/authority-guard.ts`):
  - Suporte aos tokens `AUTHORITY_ADMIN_TOKEN`, `AUTHORITY_OPERATOR_TOKEN`, `AUTHORITY_REVIEWER_TOKEN`, `AUTHORITY_PUBLISHER_TOKEN`, `AUTHORITY_VIEWER_TOKEN`.
  - Mapeamento de papéis (Admin, Operator, Reviewer, Publisher, Viewer).
- [ ] **TASK-03.2:** Proteger rotas de mutação, intake e provisionamento exigindo tokens com privilégios adequados.
- [ ] **TASK-03.3:** Garantir proteção contra vazamento: tokens e chaves de serviço nunca devem ser retornados no payload do cliente.

---

### FASE 4 — Ingestão de Persona, Binding e Manifesto
- [ ] **TASK-04.1:** Implementar endpoint de ingestão `POST /api/v1/persona/intake`:
  - Validar estado `approved`, `persona_id`, `persona_version_id` e integridade do `content_hash` (`sha256:...`).
  - Rejeitar snapshots corrompidos ou versões stale.
- [ ] **TASK-04.2:** Gravar binding imutável em `custom_audience.audience_persona_bindings` e criar/atualizar o `AudienceProject`.
- [ ] **TASK-04.3:** Implementar parser e gerador de Manifesto YAML (`lib/manifest/`):
  - Validação de schema (nicho, idioma, template, pilares, canais, monetização).
  - Versionamento de manifestos e snapshot de configuração para os módulos.

---

### FASE 5 — Editorial Engine, Sistema de Templates e Editor Visual
- [ ] **TASK-05.1:** Implementar motor editorial relacional (`lib/editorial/`):
  - Criação de jobs com pauta de 4+ pontos e meta de 1.300 palavras.
  - Persistência de fontes com URL, data e limitações.
  - Fact-check e classificação de claims (`fato`, `hipótese`, `opinião`, `bloqueado`).
  - Geração de drafts e auditoria de SEO.
- [ ] **TASK-05.2:** Implementar Theme Manifest e resolução de Design Tokens:
  - Tokens para cor, tipografia, densidade, espaçamento e contraste WCAG AA.
- [ ] **TASK-05.3:** Conectar o Editor Visual por blocos permitidos à API de persistência:
  - Suporte a blocos `Hero`, `Article Grid`, `Featured Guide`, `Comparison`, `Product Recommendation`, `Newsletter`, `FAQ`.
  - Preview responsivo e persistência de layout sem quebra de regras.

---

### FASE 6 — Social Engine & Monetização FBR Ads
- [ ] **TASK-06.1:** Módulo de Descoberta de Canais Sociais:
  - Registro de capacidades e modelo de adequação baseado em nicho e público.
  - Geração de variantes por canal sem cópia cega.
  - Trava obrigatória: publicação externa bloqueada por padrão até aprovação.
- [ ] **TASK-06.2:** Módulo de Monetização & FBR Ads:
  - Inventário central com suporte estrito aos formatos `1250x150` e `350x350`.
  - Validação obrigatória de disclosure em links de afiliados.
  - Registro de eventos analíticos com origem auditável.

---

### FASE 7 — Orquestração Durável Agency Flux & Control Tower
- [ ] **TASK-07.1:** Módulo Outbox/Inbox idempotente:
  - Tabela `custom_audience.audience_inbox_events` e `audience_outbox_events`.
  - Processamento atômico de jobs com `event_id` e garantia contra replay.
- [ ] **TASK-07.2:** Adapter Control Tower:
  - Chamada de provisionamento usando o namespace `fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71`.
  - Readback obrigatório de projeto e status após operações de infraestrutura.

---

### FASE 8 — Testes E2E, Smoke Tests e Validação Autônoma
- [ ] **TASK-08.1:** Criar suíte de testes de integração com o schema `custom_audience`:
  - Testes de CRUD relacional com rollback.
  - Testes de preflight e `/health`.
  - Testes de autenticação de tokens RBAC.
- [ ] **TASK-08.2:** Criar script de smoke test (`scripts/smoke-test.ts`):
  - Verifica endpoints essenciais (`/health`, `/api/v1/projects`, `/api/v1/manifest`).
  - Garante ausência de 500s e validação de schema.
- [ ] **TASK-08.3:** Executar suíte completa (`vitest run`, `tsc --noEmit`, `eslint`).

---

### FASE 9 — Build Standalone, Dockerfile & Validação para VPS2
- [ ] **TASK-09.1:** Configurar Next.js para output `standalone` em `next.config.js`.
- [ ] **TASK-09.2:** Ajustar `Dockerfile` multi-stage para gerar imagem leve rodando na porta 3400 e host 0.0.0.0.
- [ ] **TASK-09.3:** Validar que o build de produção (`npm run build`) conclui com zero erros.
- [ ] **TASK-09.4:** Documentar checklist de deployment no Easypanel conforme [audience-dev-doc (1).md](file:///f:/Projetos/_FBR/FBR%20Audience/02-prd/audience-dev-doc%20(1).md).

---

## 5. Critérios de Sucesso para Conclusão da Tasklist

1. **Schema Ativo:** Todas as tabelas criadas no schema `custom_audience` sem resíduos em `public`.
2. **Health Check Verde:** `GET /health` responde HTTP 200 com conexão ao banco verificada (`SELECT 1`).
3. **Imutabilidade de Persona:** Vínculo de persona grava hash e rejeita alterações silenciosas.
4. **Pipeline Editorial & Social Operacional:** Drafts, fontes, claims, variantes e anúncios vinculados com persistência relacional.
5. **Fail-Closed:** Publicações externas e gastos permanecem travados sem Gate humano.
6. **Suíte 100% PASS:** Todos os testes unitários, de integração e smoke tests aprovados.
