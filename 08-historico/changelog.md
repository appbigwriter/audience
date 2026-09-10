# Changelog

## Production-readiness slice

- substituído o repositório mockado por `JsonRepository` durável e `SupabaseRepository` PostgREST
- criado runtime singleton com fallback local explícito por `APP_ENV`
- adicionados adapters configuráveis para Control Tower, Hermes e FBR Ads
- persistidos receipts de gestor, handoffs e jobs
- production-readiness: PostgREST com schema configurável, RPC Control Tower real e fallback local singleton explícito; Hermes/FBR Ads sem contratos inventados
- mantida a ordem Gestor Editorial validado antes do Control Tower
- adicionados testes de contrato do repositório e HTTP mock do Control Tower
