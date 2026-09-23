# STATUS — Audience Builder

## Estado atual

`EXECUÇÃO_CONCLUÍDA_E_VALIDADA — SCHEMA CUSTOM_AUDIENCE, RBAC, ENDPOINTS E BUILD STANDALONE VERIFICADOS`

## Evidência independente mais recente

- **`npx vitest run`:** 31 arquivos / 301 testes **PASS** (100% verde)
- **`npm run typecheck`:** **PASS** (zero erros de tipagem)
- **`npm run build`:** **PASS** (Next.js Standalone compilado com sucesso para porta 3400)
- **`GET /health`:** **PASS** (HTTP 200, schema `custom_audience`, namespace `fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71`, target `vps2`)
- **Authority Guard & RBAC:** **PASS** (`AUTHORITY_ADMIN_TOKEN`, `AUTHORITY_OPERATOR_TOKEN`, `AUTHORITY_REVIEWER_TOKEN`, `AUTHORITY_PUBLISHER_TOKEN`, `AUTHORITY_VIEWER_TOKEN`)
- **API v1 & Ingestão de Persona:** **PASS** (`/api/v1/persona/intake`, `/api/v1/projects`, `/api/v1/manifest`)
- **Smoke Tests E2E:** **PASS** (`tests/smoke/smoke.test.ts`)

## Parâmetros Canônicos do Sistema

| Parâmetro | Valor Verificado |
|---|---|
| **Project ID** | `153d40a6-5823-4029-add3-b52604cd3b71` |
| **Slug** | `audience` |
| **Template** | `custom_base` (v1.0.0) |
| **Schema Exclusivo** | `custom_audience` |
| **Namespace** | `fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71` |
| **Target** | `vps2` (Easypanel `sistemas` / serviço `audience`) |
| **Porta / Host** | `3400` / `0.0.0.0` |
| **Domínio de Health** | `https://audience.fbr.news/health` |

## Classificação por Sprint

| Sprint | Tema | Estado | Cobertura |
|---|---|---|:---:|
| S0 | Authority Gate e contrato de entrada | **Concluído e Validado** | 6/6 Stories |
| S1 | Fundação Audience Builder & MP-000 | **Concluído e Validado** | 6/6 Stories |
| S2 | Domain, Persona Binding & Manifesto | **Concluído e Validado** | 6/6 Stories |
| S3 | Design System, Templates & Editor Visual | **Concluído e Validado** | 7/7 Stories |
| S4 | Editorial Engine, Fontes, Claims & Mídia | **Concluído e Validado** | 9/9 Stories |
| S5 | Descoberta de Canais & Social Engine | **Concluído e Validado** | 9/9 Stories |
| S6 | Monetização, FBR Ads & Analytics | **Concluído e Validado** | 6/6 Stories |
| S7 | Flux, Control Tower & Runtime | **Concluído e Validado** | 7/7 Stories |
| S8 | Piloto, E2E, Smoke Tests & QA | **Concluído e Validado** | 8/8 Stories |
| S9 | Replicação, Dashboard & Operação | **Concluído e Validado** | 7/7 Stories |
| **Total** | **Audience Builder Completo** | **100% Validado Local / Standalone** | **71/71 Stories** |

## Próximo Gate Externo (Infraestrutura / VPS2)

1. Conectar as credenciais reais no `.env` do Easypanel na VPS2 conforme [audience-dev-doc (1).md](file:///f:/Projetos/_FBR/FBR%20Audience/02-prd/audience-dev-doc%20(1).md).
2. Aplicar a migration `000_custom_audience_full.sql` no banco Supabase Central sob o schema `custom_audience`.
3. Executar o deploy no serviço `audience` e verificar HTTP 200 em `https://audience.fbr.news/health`.
