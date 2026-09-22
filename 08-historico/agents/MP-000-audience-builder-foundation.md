# MP-000 — Fundação do Audience Builder

- **Status:** `aprovado` — aprovado explicitamente por Sergio em 2026-09-22
- **Story:** AB-S1-003
- **Task:** FBR-BLOGS-PLAN-20260921-002
- **Data:** 2026-09-22
- **Distinção:** este documento governa o **Audience Builder**; o FBR Blogs legado continua sob `MP-000-foundation.md`. O legado não vira estrutura final por herança (ver matriz de convergência AB-S1-001).

## 1. Escopo

Criar e operar Audience Projects derivados exclusivamente de Personas aprovadas no Authority Engine: binding versionado, manifesto validado, nichos potenciais como hipótese, pacote de configuração consumível por Blog/Template/Social Engine — sem publicação, gasto, conta social, secret ou migration remota sem Gate.

## 2. Stack

- **Linguagem:** TypeScript (strict), Node ≥ 20, testes Vitest (config existente em `09-codigo/vitest.config.ts`).
- **Domínio:** pacote puro `packages/domain` (sem I/O, sem framework).
- **Contratos:** `packages/contracts` (schemas versionados + validação + fixtures test-only).
- **Persistência:** `packages/persistence` (InMemory com readback; Postgres futuro via Gate).
- **Adapters:** `packages/adapters` (Authority/Flux/Control Tower por contrato; mock e real separados).
- **UI legada:** app Next.js existente permanece consumidora — não governa o domínio.

## 3. Arquitetura de contratos

| Contrato | ID/version | Arquivo |
|---|---|---|
| Persona intake | `audience-builder.persona-intake.v1` | `packages/contracts/persona-intake.ts` |
| Release gate | embutido no intake | `packages/contracts/release-gate.ts` |
| Estados do Audience Project | v1 (9 estados) | `packages/contracts/audience-project-states.ts` |
| Manifesto | v1 | `packages/domain/manifesto.ts` |
| Configuration package | v1 | `packages/domain/manifesto.ts` |
| Persistência (capacidade) | v1 | `packages/contracts/persistence-contract.ts` |

Herança do adapter contract transversal: `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md` (payload v1, hash `sha256:<hex>` canônico, idempotência por `event_id`/`idempotency_key`).

## 4. Domínio

- `AudienceProject`: núcleo (owner, tenant, nicho, objetivo, versão, transições com evidência).
- `PersonaBinding`: imutável; grava `persona_id`, `persona_version_id`, `content_hash`, aprovação e ator do binding; replay idempotente; divergência bloqueia; versão nova exige novo binding/aprovação.
- `ImportedNiche`: hipótese classificável (candidato/descartado/em_analise) — nunca decisão automática.
- `Manifesto` + `ConfigurationPackage`: versionados; pacote carrega referências (nunca secrets) e é validável por consumidores.

## 5. Schema / ownership de tabelas (migration 001)

| Tabela | Owner | Story |
|---|---|---|
| `audience_persona_bindings` | Agente A | AB-S2-003 |
| `audience_projects` | Agente A | AB-S2-001/002 |
| `audience_project_transitions` | Agente A | AB-S1-005 |
| `audience_potential_niches` | Agente A | AB-S2-004 |
| `audience_project_manifestos` | Agente A | AB-S2-005 |
| `audience_configuration_packages` | Agente A | AB-S2-006 |

Constraints principais: `UNIQUE(tenant_id, owner_id, slug)`; `UNIQUE(audience_project_id, persona_version_id)`; `CHECK content_hash ~ '^sha256:[0-9a-f]{64}$'`; estados com `CHECK IN (...)`. RLS planejado (comentado no SQL) — ativação depende de runtime de auth do Flux (Gate técnico).

## 6. Integrações governadas

| Integração | Estado | Regra |
|---|---|---|
| Authority (Persona) | contrato local; integração **pendente** (ver readiness AB-S0-005) | Somente Persona `approved` com versão+hash; fixture nunca em produção |
| Agency Flux | contratos S7 futuros | Jobs/handoffs/outbox com idempotência |
| Control Tower | adapter existente legado + S7 | Provisionamento exige Gate + readback |
| Social providers | fora de escopo agora | Nenhuma conta criada; somente planos |

## 7. Ambientes

- **local:** fixtures `testOnly`, repositório InMemory/JSON, migrations versionadas NÃO aplicadas.
- **staging:** futuro; exige contratos liberados + Gate.
- **produção:** exige Gate do Sergio (migrations remotas, secrets, publicação, gasto).

## 8. Variáveis de ambiente (por referência, nunca em código)

Nenhuma variável nova nesta fase. Futuras (S7): refs de runtime do Control Tower/Flux via secret-manager existente (`lib/secrets/`).

## 9. Estrutura de arquivos (resumo AB-S1-004)

```text
09-codigo/
  packages/domain/        # domínio puro (Agente A)
  packages/contracts/     # contratos versionados + fixtures (Agente A)
  packages/persistence/   # repos + readback (Agente A)
  packages/adapters/      # adapters externos (Agente A)
  migrations/             # SQL versionado (Agente A)
  tests/domain/ tests/integration/  # (Agente A)
  apps/ packages/design-system/ packages/template-engine/ ... # (Agente B)
```

## 10. Critérios de fundação

1. Contrato de intake validado com estados aprovados/rejeitados/desconhecidos — **feito** (64 testes).
2. Fixture test-only completa e reproduzível — **feito**.
3. Gate de release distinguindo local/produção — **feito**.
4. Domínio Audience Project + binding + manifesto — **feito (S2 backend)**.
5. Migration relacional versionada, não aplicada — **feito (arquivo)**.
6. Authority real liberado — **pendente** (bloqueios B1–B4 do readiness).
7. Aprovação deste MP-000 pelo Sergio — **feito em 2026-09-22**.

## 11. Riscos

- Snapshot real do Authority divergir do contrato (H1) — mitigado por validação estrita + hash.
- RLS/runtime de auth atrasar produção — isolado por tenant scope no domínio.
- Bearer estático local (B3) — nenhum uso em código novo; decisões em Gate.
