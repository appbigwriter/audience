# Changelog

## Unreleased

- Auditoria do contrato transversal Authority Engine → FBR Blogs → Agency Flux → Control Tower registrada em `03-arquitetura/authority-blogs-flux-contract.md`, com receipt em `08-historico/RECEIPT-AUTHORITY-BLOGS-FLUX-CONTRACT-2026-09-18.md`.
- Alinhamento visual do frontend ao dashboard do Authority Engine: tokens, sidebar, cards de estado, pipeline, governança e workflow responsivo; receipt em `08-historico/RECEIPT-VISUAL-AUTHORITY-2026-09-18.md`.
- Integração do contrato oficial Control Tower Secret Manager com namespace `fbr/blogs/<project_id>/`, bindings idempotentes por `secret_refs`, validação, rotação e revogação protegidas por operador
- Headers, timeout, abort, URL joining seguro e erros sanitizados no adapter de produção
- Configuração explícita de `CONTROL_TOWER_SECRETS_BASE_URL`, `CONTROL_TOWER_AGENT_API_KEY`, `FBR_CALLER_SERVICE` e `FBR_ENVIRONMENT`
- Easypanel mantido como boundary fail-closed até existir contrato oficial, sem endpoints presumidos
- Receipts, manifests e developer-doc limitados a metadados e referências
