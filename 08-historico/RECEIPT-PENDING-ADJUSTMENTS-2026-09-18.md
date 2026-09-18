# Receipt — Execução priorizada da PENDING_TASKLIST

- **Task:** EXEC-20260918-PENDING-ADJUSTMENTS-001
- **Data:** 2026-09-18
- **Owner:** David
- **Escopo executado:** AUTH-FIX-UI-001, AUTH-FIX-BACKEND-002 e atualização factual do STATUS do Authority Engine.

## Executado

### Authority Engine UI

- Corrigido seletor inválido do Post Machine (`#runPM`).
- Adicionado listener para `#researchSelect`.
- Preservado `researchId` ao gerar seeds.
- Centralizado transporte de API em `apiFetch`.
- Token limitado a `sessionStorage` da sessão atual.
- Criado/verificado `dashboard-contract.test.mjs`.

### Authority Engine backend/local

- Cobertura existente de API→auth/RBAC/ownership, adapter relacional/fail-closed, Persona versionada, outbox/dedupe/retry, gates e fake adapters foi reexecutada.
- `STATUS.md` atualizado de 26 para 49 testes e passou a distinguir contrato UI local de browser/E2E remoto.

## Evidência

```text
node dashboard-contract.test.mjs → PASS
npm run check → build + 49 testes PASS
npm run check no Authority → 49/49
npm run lint/diff check aplicáveis → PASS
```

Receipts específicos:

```text
F:\Projetos\_FBR\AuthorityEngine\08-historico\RECEIPT-AUTH-FIX-UI-001-2026-09-18.md
F:\Projetos\_FBR\AuthorityEngine\08-historico\RECEIPT-AUTH-FIX-BACKEND-002-2026-09-18.md
```

## Ainda pendente/bloqueado

- E2E local conectado Authority → Flux → Blogs com fake adapters comuns;
- persistência/RLS remota e readback;
- assinatura/delivery externo;
- migrations, deploy, DNS, publicação e secrets;
- reconciliação da sequência de migrations 010/011 do Control Tower.

Nenhuma mutação externa foi executada.
