# Documentação de Integração - FBR Blogs

## 1. Identidade do projeto

- Nome: FBR Blogs
- Slug: fbr_blogs
- Tipo: custom
- Template: custom_base
- Versão do template: 1.0.0
- Schema provisionado: custom_fbr_blogs
- Domínio: não definido
- Idioma: pt
- Status: active

## 2. Objetivo

Integrar o código do blog/site com a base provisionada deste projeto.
Crie um documento .env.example com as variáveis que vai precisar que o usuário informe e acrescente as abaixo:

## 3. Variáveis de ambiente do blog

```env
# Blog runtime environment
NEXT_PUBLIC_APP_NAME=FBR Blogs
SUPABASE_URL=https://supabase-control-tower-api.fbr.news
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODkwMDI4NzAsImV4cCI6MjEwNDM2Mjg3MH0.O8OuvwNYZalxBJtkgD2OjXW0Xosa67F-WaxIl084fNg

# Optional, only if the front uses public reads directly
NEXT_PUBLIC_SUPABASE_URL=https://supabase-control-tower-api.fbr.news
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg5MDAyODcwLCJleHAiOjIxMDQzNjI4NzB9.za9fjZqGiS2QnllsIHEHO4vFNfNmBLbEhdsCAT_Lb5M
```

## 4. Regras importantes

- O blog deve usar `schema_name` como isolamento do projeto.
- O schema é dedicado e não deve ser inferido a partir do browser.
- O `template_key` define a estrutura base esperada.
- O `domain` já está definido no catálogo e pode ser usado como referência.
- O nome da aplicação no front deve ser `NEXT_PUBLIC_APP_NAME=FBR Blogs`.
- `SUPABASE_SERVICE_ROLE_KEY` deve ficar no serviço do blog/Easypanel e nunca no cliente.
- As tabelas do schema `public` são catálogo central e não devem ser alteradas pelo dev do blog.
- Qualquer personalização de entidade deve acontecer apenas no `schema_name` provisionado deste projeto.
- Se precisar evoluir entidades, usar o Editor SQL do Control Tower no projeto correto.
- Não criar, remover ou renomear tabelas do `public` a partir do blog.
- Não usar SQL ad hoc no front para mexer no catálogo central.

## 5. Tabelas esperadas no schema

- entities
- entity_relations
- records
- files
- settings
- audit_logs
- events

## 6. Como personalizar o schema da entidade

1. Confirmar que a necessidade é específica do projeto.
2. Identificar o `schema_name` do projeto.
3. Preparar o SQL apenas para esse schema.
4. Executar o SQL no Editor SQL do Control Tower ou no banco apontado para a entidade.
5. Validar o resultado sem tocar em `public`.
6. Se a mudança envolver comportamento global, voltar para a modelagem central antes de aplicar.

Exemplo de personalização segura:

```sql
alter table custom_fbr_blogs.entities
  add column if not exists notes text;
```

## 7. Mapa prático para o dev

- Home do blog: ler artigos publicados e destaques.
- Página de artigo: buscar por `slug`.
- Listagem: usar `status = PUBLISHED` ou equivalente do template.
- SEO: usar `seo_title`, `seo_description` e metadados do artigo.
- Categorias: usar `categories`.
- Autores: usar `authors`.
- Mídia: usar `media_assets` ou storage, conforme o template.

## 8. Fluxo esperado de integração

1. Confirmar o projeto no catálogo central.
2. Ler `schema_name` e `template_key`.
3. As variáveis deverão ser informadas apenas pelo usuário e na aba "Enviroment" do Easypanel.
4. Conectar o front ao schema provisionado.
5. Validar listagem, detalhe, SEO e mídia.
6. Conferir se o blog respeita o domínio informado.
7. Se precisar personalizar entidades, executar o SQL apenas no `schema_name` deste projeto.
8. Qualquer mudança em `public` deve passar pelo Control Tower e pela modelagem central.

## 9. Checklist para o dev

- [ ] O blog está apontando para o Supabase correto.
- [ ] O schema provisionado existe.
- [ ] O front usa `NEXT_PUBLIC_APP_NAME=FBR Blogs`.
- [ ] O front lê o `schema_name` deste projeto.
- [ ] O `template_key` foi seguido.
- [ ] O domínio está configurado.
- [ ] Os artigos publicados aparecem corretamente.
- [ ] Nenhuma tabela do `public` foi alterada pelo blog.
- [ ] Toda customização ocorreu no schema desta entidade.
- [ ] Se houve ajuste estrutural, o SQL foi executado no Editor SQL do Control Tower.

## 10. SQL de conferência

```sql
select id, name, slug, business_type, template_key, schema_name, domain, status, template_version
from public.projects
where slug = 'fbr_blogs';
```
