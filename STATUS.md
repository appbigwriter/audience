# STATUS — FBR Blogs

- status: `production-readiness-slice`
- fallback local: `explícito`, somente com `APP_ENV=local` ou `APP_ENV=development`
- persistência: `JsonRepository` durável local ou `SupabaseRepository` via PostgREST
- Gestor Editorial antes do Control Tower: validado por serviço e testes
- Control Tower real: adapter implementado; depende de URL, chave, contrato e paths de handoff configurados
- Hermes real: adapter HTTP/CLI explícito; não inventa API remota
- FBR Ads: provider configurável; endpoints externos ainda dependem de contrato documentado
- publicação, gasto e ativação de anúncios: bloqueados por design

## Evidência desta fatia

O fluxo local compartilha um runtime singleton, persiste blog/gestor/handoffs/jobs em JSON, rejeita produção sem Supabase e mantém mocks somente no modo local. O teste HTTP do Control Tower não usa rede nem segredos reais e prova consulta de organização, idempotência por slug, RPC condicional, readback e três handoffs

## Pendências reais

1. Configurar e testar os contratos reais Hermes e FBR Ads
2. Executar contra o Control Tower real apenas após credenciais e aprovação operacional
3. Aplicar/validar as tabelas adicionais `handoff_deliveries` e campos de receipt no schema dedicado
