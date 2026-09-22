# AB-S1-002 — Relatório de Maximização: elementos reutilizáveis do foundation

- **Task:** FBR-BLOGS-PLAN-20260921-002 (Agente A)
- **Data:** 2026-09-22
- **Regra:** recomendações ≠ decisões automáticas. Cada item traz ganho, risco e custo de adoção.

## Identificados

| # | Elemento | Onde está | Ganho se adotado | Risco | Custo | Recomendação |
|---|---|---|---|---|---|---|
| 1 | Contrato `AuthorityPersonaBindingInput` v1 + hash + idempotência | `lib/persona-binding.ts` | Base imediata do `persona-intake.v1`; evita reinvenção | Contrato legado acopla blog; AB precisa de pacote mais amplo (nichos, disclosure) | Baixo — adaptar tipos | **Adotar com extensão** (feito: novo contrato em `packages/contracts`) |
| 2 | Fixture tripartite Authority/Flux/Blogs | `tests/fixtures/authority-blogs-flux-fixture.ts` | Padrão de fixture determinística estabelecido | — | Baixo | **Adotar** (padrão seguido em `persona-fixtures.ts`) |
| 3 | Erros tipados com code+httpStatus | `PersonaBindingContractError` | Branch determinístico por código | — | Baixo | **Adotar** (feito: `AudienceBuilderContractError`) |
| 4 | Adapter Control Tower (provisiona projeto/schema/handoffs) | `lib/control-tower/` | Reuso direto em S7 sem reescrever | Presume endpoints; real-client exige runtime | Médio | **Adaptar em S7** (separar mock/real já existe) |
| 5 | Secret-manager por referência | `lib/secrets/` (209 linhas) | Nenhuma manipulação de segredo nova necessária | — | Baixo | **Manter centralizado** — não duplicar no AB |
| 6 | Contratos de Ads (1250x150, 350x350) + inventário | `lib/ads/`, `04-database/schema.sql` | Inventário S6 referencia formatos já contratados | — | Baixo | **Reutilizar** em S6 |
| 7 | Handoff deliveries + receipts | `lib/repository.ts` | Padrão de receipt sanitizado | — | Baixo | **Reutilizar padrão** em S7 handoffs |
| 8 | Drafts com fonte/versão/gate (editorial legado) | `lib/editorial/daily-run.ts` | Pipeline S4 herda conceito | Legado usa JSON store | Médio | **Adaptar** para relacional em S4 |
| 9 | QA/fact-check workflow (claims com fonte) | `lib/seo/review.ts` | Base para AB-S4-006 | Atual é raso | Médio | **Adaptar** |
| 10 | JSON store como estado operacional | `lib/repository.ts` (JsonRepository) | Nenhum | Confunde dev com produção | — | **Não adotar** para AB (manter como legado) |

## Duplicações a evitar (permanecer centralizado)

- Hash canônico + validação de hash → somente em `packages/contracts/common.ts`.
- Erros tipados → contrato comum (não recriar por pacote).
- Fixtures de Persona → `packages/contracts/persona-fixtures.ts` (fonte única; testes B também consomem).

## Não-recomendações explícitas

- Não reutilizar `BlogService.createBlog()` (provisionamento genérico `custom_base`) como caminho de criação do AB — cria projeto fora da governança Audience Project.
- Não reutilizar o `POST /api/blogs` público como entrada do AB (sem auth de serviço).
