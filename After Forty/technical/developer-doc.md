# Documentação de Integração Técnica - After Forty by Heidi Braun

## 1. Identidade e Governança do Projeto

- **Nome da Aplicação:** After Forty by Heidi Braun
- **Project ID (UUID):** `68382b4b-ffea-4717-9e2f-4928dea695df`
- **Slug:** `afterforty`
- **Tipo de Negócio:** `blog`
- **Template Base:** `blog_standard` (v1.0.0)
- **Schema documentado (não verificado externamente):** `blog_afterforty`
- **Domínio Oficial:** `afterforty.fbr.news`
- **Idioma:** `en`
- **Status documental:** `documented_only` — sem readback externo nesta auditoria
- **Namespace de Secrets <secret-ref:runtime>

---

## 2. Política de Secrets e Injeção de Variáveis

> [!IMPORTANT]
> **Princípio Zero Secret Leaks <secret-ref:runtime>

### Onde configurar as variáveis:
1. **Ambiente Local de Desenvolvimento:** Crie um arquivo `.env.local` (garantido no `.gitignore`) substituindo as referências pelas credenciais do seu ambiente de teste.
2. **Ambiente de Produção (Easypanel) <secret-ref:runtime>

---

## 3. Modelo de Variáveis (.env.example)

```env
# =========================================================================
# 1. VARIÁVEIS PÚBLICAS (Frontend / Client-Side)
# Podem ser expostas no bundle do browser com prefixo NEXT_PUBLIC_
# =========================================================================
NEXT_PUBLIC_APP_NAME="After Forty by Heidi Braun"
NEXT_PUBLIC_SUPABASE_URL=https://supabase-control-tower-api.fbr.news
NEXT_PUBLIC_SUPABASE_ANON_KEY <secret-ref:runtime>

# =========================================================================
# 2. VARIÁVEIS PRIVADAS DE RUNTIME (Backend / Workers / Servidor)
# Injetar EXCLUSIVAMENTE na aba Environment do Easypanel / Secret Manager.
# NUNCA comitar no Git, NUNCA expor no Frontend, NUNCA colar em chat/logs.
# =========================================================================
SUPABASE_URL=https://supabase-control-tower-api.fbr.news
SUPABASE_SERVICE_ROLE_KEY <secret-ref:runtime>
CONTROL_TOWER_PROJECT_ID=68382b4b-ffea-4717-9e2f-4928dea695df
CONTROL_TOWER_SCHEMA_NAME=blog_afterforty
```

---

## 4. Regras de Arquitetura e Isolamento

1. **Isolamento por Schema:** Todo o código da aplicação deve operar exclusivamente dentro do schema `blog_afterforty`.
2. **Catálogo Central (`public`):** As tabelas no schema `public` pertencem à governança central do Control Tower. O blog/sistema **NUNCA** deve criar, alterar ou excluir tabelas em `public`.
3. **Chave de Serviço <secret-ref:runtime>
4. **Evolução de Estrutura:** Se o projeto necessitar de novas tabelas ou colunas específicas, aplique o SQL no schema `blog_afterforty` via Editor SQL do Control Tower.

---

## 5. Tabelas Provisionadas no Schema `blog_afterforty`

- users
- categories
- authors
- tags
- articles
- article_tags
- media_assets
- seo_pages
- redirects
- settings

---

## 6. Exemplo de Customização Segura de Schema

Caso precise adicionar campos específicos ao seu projeto:

```sql
-- Executar via Control Tower apontando para o schema do projeto:
alter table blog_afterforty.articles
  add column if not exists custom_notes text;
```

---

## 7. Checklist de Validação do Desenvolvedor

- [ ] Arquivo `.env.local` configurado localmente e presente no `.gitignore`.
- [ ] No Easypanel, as variáveis privadas foram salvas na aba **Environment**.
- [ ] O frontend utiliza apenas variáveis com prefixo `NEXT_PUBLIC_`.
- [ ] As consultas Supabase especificam o schema `blog_afterforty`.
- [ ] Nenhuma query afeta ou consulta tabelas do schema `public`.
- [ ] O health check da aplicação respondeu com sucesso (HTTP 200).

---

## 8. Query de Conferência Cadastral

```sql
select id, name, slug, business_type, template_key, schema_name, domain, status, template_version
from public.projects
where id = '68382b4b-ffea-4717-9e2f-4928dea695df';
```
