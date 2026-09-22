# AB-S1-004 — Estrutura de Repositório e Teste de Ownership

- **Task:** FBR-BLOGS-PLAN-20260921-002 (Agente A)
- **Data:** 2026-09-22

## Árvore (01-conceitual → 09-codigo)

```text
FBR Blogs/
  01-conceitual/      visão e conceito do produto
  02-prd/             PRDs, sprints/stories, status
  03-arquitetura/     contratos transversais (Authority/Flux/CT)
  04-database/        schema legado (DDL)
  05-workflows/       fluxos operacionais
  06-design/          design (Agente B)
  07-marketing/       go-to-market
  08-historico/       receipts, auditorias, handoffs
    agents/           handoffs específicos de agente (este track escreve aqui)
  09-codigo/
    app/              UI legada Next.js (read-only para Agente A)
    lib/              vertical legada (read-only para Agente A)
    migrations/       SQL versionado do AB (Agente A)  ← novo
    packages/
      contracts/      contratos+fixtures versionados (Agente A)  ← novo
      domain/         domínio puro do AB (Agente A)  ← novo
      persistence/    repos + readback (Agente A)  ← novo
      adapters/       adapters externos do AB (Agente A)  ← novo
      design-system/  (Agente B — futuro)
      template-engine/ (Agente B — futuro)
    tests/
      domain/         testes de domínio AB (Agente A)  ← novo
      integration/    testes de integração AB (Agente A)  ← novo
      ui/ visual/     (Agente B — futuro)
```

## Responsabilidades por pasta (AB)

| Pasta | Responsabilidade | Não faz |
|---|---|---|
| `packages/contracts` | schemas versionados, validação, fixtures test-only, gate de release | I/O, banco, rede |
| `packages/domain` | entidades, transições, binding, manifesto, nichos | I/O; segredos; publicação |
| `packages/persistence` | repos (InMemory hoje), readback, isolamento tenant | regras de negócio |
| `packages/adapters` | clientes externos por contrato (mock/real separados) | decisões de domínio |
| `migrations` | DDL versionado AB | execução remota (Gate) |
| `tests/domain` | unitários de contratos/domínio | chamadas externas |
| `tests/integration` | fluxos completos locais com fixtures | integracão real (sem readback = pendente) |

## Regra de não-colisão (dois agentes)

Ownership exclusivo por prefixo de path; tipos compartilhados vivem em `packages/contracts` (Agente A) e são consumidos pelo B. Nenhum agente escreve no path exclusivo do outro sem handoff registrado em `08-historico/agents/`.

## Teste de ownership (executável)

Ver `tests/integration/ownership-paths.test.ts` — valida que os artefatos do track A vivem somente nos paths de Agente A e que nenhum arquivo do track A toca paths exclusivos do Agente B.
