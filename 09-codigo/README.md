# Código FBR Blogs

O runtime usa adapters reais quando configurado e não faz fallback silencioso

## Modos

- `APP_ENV=production`: exige Supabase/PostgREST e falha sem `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ENV=development` ou `APP_ENV=local`: usa o fallback JSON durável em `BLOG_LOCAL_DATA_PATH`, apenas para desenvolvimento e smoke tests
- Hermes real exige `HERMES_API_URL` + `HERMES_API_KEY` + paths fornecidos pelo contrato do provedor, ou `HERMES_CLI_COMMAND`
- Control Tower usa `CONTROL_TOWER_API_URL`, consulta organização e projeto por slug, chama somente o RPC documentado `provision_project` quando não há duplicata, lê o projeto novamente e busca os três handoffs por paths configuráveis
- FBR Ads expõe interface de inventory/creative selection sem inventar endpoints. Sem contrato configurado, retorna erro explícito

As rotas reutilizam um runtime singleton por processo, evitando um repositório novo a cada request. O fluxo de criação persiste o blog, cria e valida o Gestor Editorial e só depois chama o Control Tower. O receipt inclui manager, projeto, schema, estado e os três handoffs

## Comandos

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Não há publicação, provisionamento real ou mutação de anúncios no smoke local
