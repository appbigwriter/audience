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

## Deploy no Easypanel/VPS

Defina as variáveis no secret manager do deploy, nunca em documentos versionados: `APP_ENV=production`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BLOG_SCHEMA`, `CONTROL_TOWER_API_URL`, `CONTROL_TOWER_API_KEY`, `CONTROL_TOWER_ORGANIZATION_SLUG` e o contrato Hermes (HTTP com URL, chave e paths documentados ou `HERMES_CLI_COMMAND`). Configure `CONTROL_TOWER_HANDOFF_BASE_URL` e `CONTROL_TOWER_HANDOFF_PATH_TEMPLATE` somente quando o serviço de handoff tiver contrato próprio. FBR Ads só é ativado com URL, chave e paths fornecidos pelo provedor; o código não presume endpoints externos.

Credenciais pertencem ao secret manager do Easypanel/VPS e nunca devem ser commitadas no git ou incluídas em handoffs
