# Matriz de Ownership e Gates — Audience Builder

- **Story:** AB-S1-006
- **Task:** FBR-BLOGS-PLAN-20260921-002 (Agente A)
- **Data:** 2026-09-22
- **Critério:** nenhuma entidade crítica sem dono; publicação/gasto/comunicação pública/secrets com Gate explícito; Kora mantém estado operacional; QA bloqueia mas não aprova ação humana reservada.

## 1. Ownership por capacidade

| Capacidade | Owner | Como exerce | Evidência |
|---|---|---|---|
| Persona canônica + aprovação | **Authority Engine** | Emite `persona.approved` + read model com hash | Contrato transversal; readiness AB-S0-005 |
| Contratos de intake do AB | **Agente A** | `packages/contracts/persona-intake.v1` | Testes `tests/domain/persona-intake.test.ts` |
| Domínio Audience Project | **Agente A** | `packages/domain/audience-project.ts` | `tests/domain/audience-project.test.ts` |
| Manifesto/pacote de config | **Agente A** | `packages/domain/manifesto.ts` | `tests/domain/manifesto.test.ts` |
| Persistência/migrations | **Agente A** | `packages/persistence`, `migrations/001…sql` | Readback verificável |
| UI/templates/design system | **Agente B** | paths `apps/`, `packages/design-system/`, `template-engine/`, `tests/ui|visual/` | Fora do escopo deste track |
| Jobs/handoffs/orquestração | **Agency Flux** | Inbox/outbox idempotentes (S7) | Pendente |
| Provisionamento técnico | **Control Tower** | Recebe do Flux, retorna readback | Adapter legado existe; S7 ampliará |
| Estado operacional Kanban | **Kora** | Autoridade única de transições de card | Herdado do foundation |
| QA independente | **Gabe/GPT-5.6** | Bloqueia promotion; não aprova Gates humanos | Sprint review obrigatória |
| Revisão de Sprint | **David (GPT-5.6-luna-900k)** | “Esse recurso corresponde exatamente ao que o sistema necessita?” | Registro por Sprint |
| Decisões de produto/Gates humanos | **Sergio** | Aprovação explícita registrada | Abaixo |

## 2. Gates explícitos

| Ação | Gate | Quem aprova | Codificado em |
|---|---|---|---|
| Publicação de conteúdo | G-publicação | Sergio | `publicationRequiresExternalGate()` — domínio nega por padrão |
| Gasto/mídia paga | G-gasto | Sergio | Fora do domínio; nenhum código de spend existe |
| Criação de conta social | G-social | Sergio | `planStatus: planned/configured` nunca cria conta |
| Migration remota/deploy | G-deploy | Sergio | Migrations são somente arquivos versionados |
| Secrets | G-secret | Sergio + método seguro | Pacotes carregam apenas referências |
| Produção com fixture | — | **Proibido sempre** | `release-gate.ts` check `no_test_fixture_in_production` |
| Expansão do piloto | G-expansão | Sergio | Story AB-S8-008 |

## 3. Regras de não-colisão (dois agentes)

- Paths exclusivos respeitados (ver SPRINTS-STORIES, “Contrato de implementação multiagente”).
- Tipos compartilhados pertencem ao Agente A (`packages/contracts`); Agente B somente consome.
- Agente B não cria persistência paralela em JSON; Agente A não substitui dashboard exigido por endpoint.
- Integração final e testes completos: coordenador.

## 4. Lacunas de ownership conhecidas

| Entidade | Situação | Ação |
|---|---|---|
| Runtime de auth serviço-a-serviço (B3) | sem owner definitivo | David decide com Gate técnico antes de integração real |
| Social providers reais | sem contrato oficial | Permanece planejado; nenhuma ação externa |
