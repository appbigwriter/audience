# Changelog

## Production-readiness slice

- substituído o repositório mockado por `JsonRepository` durável e `SupabaseRepository` PostgREST
- criado runtime singleton com fallback local explícito por `APP_ENV`
- adicionados adapters configuráveis para Control Tower, Hermes e FBR Ads
- persistidos receipts de gestor, handoffs e jobs
- mantida a ordem Gestor Editorial validado antes do Control Tower
- adicionados testes de contrato do repositório e HTTP mock do Control Tower
