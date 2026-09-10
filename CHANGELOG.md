# Changelog

## Unreleased

- Integração do contrato oficial Control Tower Secret Manager com namespace `fbr/blogs/<project_id>/`, bindings idempotentes por `secret_refs`, validação, rotação e revogação protegidas por operador
- Headers, timeout, abort, URL joining seguro e erros sanitizados no adapter de produção
- Configuração explícita de `CONTROL_TOWER_SECRETS_BASE_URL`, `CONTROL_TOWER_AGENT_API_KEY`, `FBR_CALLER_SERVICE` e `FBR_ENVIRONMENT`
- Easypanel mantido como boundary fail-closed até existir contrato oficial, sem endpoints presumidos
- Receipts, manifests e developer-doc limitados a metadados e referências
