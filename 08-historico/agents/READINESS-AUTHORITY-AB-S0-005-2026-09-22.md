# Readiness Report — Authority Engine para o Audience Builder

- **Story:** AB-S0-005
- **Task:** FBR-BLOGS-PLAN-20260921-002 (Agente A)
- **Data:** 2026-09-22
- **Fontes verificadas:** `03-arquitetura/authority-blogs-flux-contract.md` (auditoria 2026-09-18), `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`, `08-historico/RECEIPT-AUTHORITY-BLOGS-FLUX-CONTRACT-2026-09-18.md`, `09-codigo/tests/authority-blogs-flux-contract.test.ts` (8 testes locais verdes), `09-codigo/tests/persona-binding.test.ts` (4 testes locais verdes)

## Sumário

| Área | Estado | Classificação |
|---|---|---|
| Núcleo local de Persona versionada (Authority `persona-domain.ts`) | Confirmado por auditoria 2026-09-18 | **fato** |
| Snapshot com Bibles/Visual/Editorial/ChannelPlans | Confirmado por auditoria | **fato** |
| Evento `persona.approved` (envelope ID-only) | Contrato v1 fechado localmente; testes locais | **fato local / hipótese de integração** |
| Read model aprovado por `persona_id` | Contrato v1 documentado; sem API pública do Authority | **bloqueio** |
| API oficial Authority para consulta de Persona aprovada | Inexistente no contrato consultado | **bloqueio** |
| Outbox assinado Authority | Inexistente | **bloqueio** |
| Autenticação serviço-a-serviço | Bearer estático local marcado como provisório | **bloqueio** (Gate técnico pendente) |
| Autorização de provisionamento/publicação | Fora do escopo do Authority | **decisão** (Gate Sergio) |

## Fatos (evidência real citada)

1. **F1** — `09-codigo/tests/authority-blogs-flux-contract.test.ts` executa 8 testes localmente (verdes em `npm test` 2026-09-22) provando o fluxo v1 com fixtures: evento → validação → binding input → readback metadata-only.
2. **F2** — `09-codigo/tests/persona-binding.test.ts` (4 testes verdes) valida `AuthorityPersonaBindingInput` v1 no consumidor Blogs legado.
3. **F3** — O snapshot do Authority já carrega os campos exigidos pelo conceito AB (identidade, voz, audiência, pilares, claims, guardrails, Bibles, planos por canal) — confirmado na seção 2.1 do contrato transversal.
4. **F4** — Adapter contract v1 (`authority-blogs-flux-adapter-contract-v1.md`) define payload completo `AuthorityPersonaBindingInput` com versão/hash/aprovação; adotado como base do `persona-intake.v1` do AB.

## Hipóteses (não tratar como integração)

- **H1** — O formato do `PersonaIntakePackage` do AB cobrirá o snapshot real do Authority sem quebra. Derivado do contrato v1; **não verificado contra API real**.
- **H2** — Timeout de 5s (read) / 15s (provisionamento) do adapter v1 serão suficientes. Valores de referência locais.

## Bloqueios

| # | Bloqueio | Owner do desbloqueio | Next action | Next check |
|---|---|---|---|---|
| B1 | API oficial de consulta de Persona aprovada por id/versão | Time Authority (David coordena) | Expor read model aprovado com `content_hash` | Quando Authority liberar contrato HTTP público |
| B2 | Outbox de eventos assinados `persona.approved` | Time Authority | Implementar outbox + assinatura | Junto com B1 |
| B3 | Autenticação serviço-a-serviço definitiva (substituir bearer estático) | David + Gate técnico | Decidir identidade (mTLS/JWT assinado) | Antes de qualquer integração real |
| B4 | Registro de blogs derivados no Authority (`blog_id`, `blog_name_version_id`) | Time Authority | Endpoint de registro de derivados | Após B1 |

## Decisões registradas

- **D1** — O AB desenvolverá com contratos versionados + fixtures `testOnly` enquanto B1–B4 persistem (aprovado no planejamento; STATUS-AUDIENCE-BUILDER.md).
- **D2** — Integração real permanece **pendente** até readback oficial do Authority; nenhum teste local é apresentado como integração.

## Conclusão

**Pronto para consumo local/contratual; NÃO pronto para integração de produção.** O gate de release do AB (`release-gate.ts`) codifica exatamente esta fronteira: produção exige `externalIntegrationAuthorized` (Gate) e proíbe fixture.
