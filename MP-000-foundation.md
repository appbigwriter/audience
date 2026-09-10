# MP-000 — Fundação FBR Blogs

Status: `draft` / `em_validacao`

## Escopo
Orquestrar blogs temáticos desde intake até drafts editoriais diários, sem publicar ou gastar mídia automaticamente.

## Arquitetura
Next.js + TypeScript em `09-codigo`, domínio puro com repositório mock seguro, adapters para Hermes, Control Tower, FBR Ads e imagens. Produção futura usa Postgres/Supabase via GestaoDB; o mock não simula credenciais nem contratos externos.

## Ordem e ownership
Íris recebe e roteia intake. Kora é autoridade única do Kanban e das transições. Gestor Editorial precisa ser criado e validado antes do Control Tower. Théo acompanha provisionamento. Gabe faz QA. Sergio aprova publicação, gasto e ação destrutiva.

## Schema
`blog_config`, `blog_agents`, `editorial_jobs`, `research_briefs`, `article_drafts`, `article_ads`, `ad_inventory`, `handoff_deliveries`, `workflow_events`, `social_content`, `seo_reviews`; DDL em `04-database/schema.sql`.

## Dependências
Node/npm para execução local. Produção depende de Control Tower/GestaoDB, profiles Hermes e FBR Ads, todos contratados por interfaces internas nesta versão.

## Riscos e limites
Contratos externos, provider de imagens, sincronização real da Kora e banco VPS ainda precisam de confirmação. Nenhum segredo é aceito no domínio. Todo conteúdo termina em `draft` ou `blocked`.
