# Contrato v1 — Authority → Flux → FBR Blogs

- **Status:** contrato local fechado para teste; integração externa não autorizada/verificada.
- **Fonte:** `GLOBAL-FLOW-AUTHORITY-BLOGS-FLUX-CONTROL-TOWER.md`
- **Consumidor:** FBR Blogs
- **Orquestrador:** FBR Agency Flux
- **Fonte canônica:** Authority Engine

## Decisão de integração

O evento `persona.approved` permanece pequeno e transporta somente identificadores e metadados. O Flux não repassa um snapshot inventado nem lê tabelas internas.

O fluxo v1 é:

```text
Authority outbox: persona.approved
        ↓ event envelope
Flux inbox deduplicado por event_id + consumer
        ↓ GET autenticado do read model aprovado no Authority
Flux valida persona_id, persona_version_id, status e content_hash
        ↓ POST autenticado ao FBR Blogs
FBR Blogs valida aprovação, versão, hash e idempotency_key
        ↓ readback metadata-only
Flux grava job/handoff/receipt e só avança com readback verified
```

## 1. Evento Authority → Flux

```json
{
  "event_id": "uuid",
  "event_type": "persona.approved",
  "event_version": 1,
  "occurred_at": "ISO-8601",
  "source": "authority-engine",
  "aggregate_type": "persona",
  "aggregate_id": "persona-id",
  "aggregate_version": 3,
  "correlation_id": "uuid",
  "causation_id": "uuid|null",
  "payload": {
    "persona_id": "persona-id",
    "persona_version_id": "persona-version-id",
    "blog_id": "blog-id",
    "blog_name_version_id": "blog-name-version-id"
  }
}
```

O evento não contém snapshot completo, token, senha, service role ou qualquer secret.

## 2. Read model Authority → Flux

O Flux consulta o read model aprovado por `persona_id` e exige:

```text
persona_id
persona_version_id
persona_version
status = approved
content_hash
snapshot
source_run_ids
```

O Flux deve recusar:

- status diferente de `approved`;
- `persona_version_id` divergente do evento;
- `persona_id` divergente do evento;
- read model sem `content_hash`;
- resposta cuja versão não corresponda à aprovação recebida.

Timeout local de referência: **5 segundos**. O provider efetivo ainda depende de contrato/autorização próprios.

## 3. Request Flux → FBR Blogs

O Flux converte o evento + read model + contexto do projeto no `AuthorityPersonaBindingInput` v1:

```text
contractVersion = 1
idempotencyKey = event_id
eventId = event_id
sourceEventId = event_id
correlationId = event.correlation_id
causationId = event.causation_id
personaId = event.payload.persona_id
personaVersionId = event.payload.persona_version_id
personaVersion = read_model.persona_version
personaStatus = approved
personaSnapshotHash = sha256:<read_model.content_hash>
personaApprovalId
approvedBy
approvedAt
approvalScope
approvedVersions
blog
snapshot
```

O snapshot entregue ao Blog deve ser a transformação determinística do read model aprovado. O Blog não deve gerar novamente a Persona.

Provisionamento possui timeout de referência de **15 segundos**. O valor efetivo exige contrato do runtime.

## 4. Autenticação

A implementação local atual usa:

```text
Authorization: Bearer <FBR_BLOGS_SERVICE_TOKEN>
```

O valor nunca aparece em código versionado, fixture, receipt ou log. A ausência ou divergência retorna:

```text
401 SERVICE_AUTHENTICATION_REQUIRED
```

Antes de produção, o bearer estático deve ser substituído ou formalmente incorporado ao contrato de identidade serviço-a-serviço assinado. Esta decisão ainda depende de Gate técnico.

## 5. Idempotência

O consumidor lógico do Flux é:

```text
flux.persona-approved.provisioning
```

A chave mínima é:

```text
event_id + consumer
```

No FBR Blogs:

```text
idempotencyKey = event_id
```

Repetição do mesmo evento deve retornar o receipt original e não criar:

- segundo `blog_id`;
- segundo binding;
- segundo schema;
- segundo namespace;
- segunda chamada de provisionamento.

## 6. Resposta do FBR Blogs

Sucesso:

```json
{
  "receiptId": "receipt:uuid",
  "blogId": "uuid",
  "personaId": "uuid",
  "personaVersionId": "uuid",
  "tenantId": "tenant",
  "fluxProjectId": "project",
  "correlationId": "uuid",
  "status": "configured",
  "bindingStatus": "bound",
  "eventId": "uuid"
}
```

O readback é metadata-only. Não retorna `snapshot`, `source_run_ids`, tokens, authorization headers ou secret values.

## 7. Códigos mínimos

| Código | HTTP | Significado |
|---|---:|---|
| `SERVICE_AUTHENTICATION_REQUIRED` | 401 | serviço não autenticado |
| `DUPLICATE_SLUG` | 409 | slug já associado a outro blog |
| `PERSONA_NOT_APPROVED` | 422 | Persona sem aprovação explícita |
| `SNAPSHOT_HASH_MISMATCH` | 422 | snapshot não corresponde à versão aprovada |
| `APPROVED_VERSION_MISMATCH` | 422 | versão não está no pacote aprovado |
| `EXPLICIT_APPROVAL_REQUIRED` | 422 | metadados de aprovação ausentes |
| `UNSUPPORTED_CONTRACT_VERSION` | 422 | versão v1 não suportada |
| `EVENT_ID_REQUIRED` | 422 | evento/chave de idempotência ausente |
| `BINDING_PERSISTENCE_NOT_CONFIGURED` | 503 | persistência do binding não configurada |
| `INVALID_REQUEST` | 400 | payload inválido não classificado |

## 8. Evidência local

A fixture e o teste estão em:

```text
09-codigo/tests/fixtures/authority-blogs-flux-fixture.ts
09-codigo/tests/authority-blogs-flux-contract.test.ts
```

Eles verificam localmente:

- enriquecimento do evento ID-only pelo read model;
- validação do payload v1;
- autenticação fail-closed;
- idempotência;
- códigos de erro;
- receipt sanitizado.

## 9. Limites

Este contrato local não prova:

- assinatura real entre serviços;
- API remota disponível;
- persistência Supabase do binding;
- readback remoto do Authority;
- readback remoto do Control Tower;
- deploy, DNS, publicação ou secrets injetados.

Esses itens permanecem Gates posteriores.
