# FBR Blogs

Plataforma de geração, customização, provisionamento e gestão de blogs temáticos da FBR Agency.

## Estrutura do projeto

- `01-conceitual/` — visão, objetivos, escopo e decisões de produto
- `02-prd/` — requisitos, critérios de aceite e mini PRDs
- `03-arquitetura/` — arquitetura, integrações e decisões técnicas
- `04-database/` — schema, migrations, seeds e documentação de dados
- `05-workflows/` — fluxos editoriais, gates e automações
- `06-design/` — identidade visual e especificações de cada blog
- `07-marketing/` — estratégia editorial, SEO, afiliados e distribuição
- `08-historico/` — decisões, changelogs e registros do projeto
- `09-codigo/` — código-fonte e testes da aplicação

O sistema deverá incluir o Redator Chefe, pesquisa editorial, SEO, imagens, Amazon Associates, integração com FBR Ads e provisionamento de blogs individuais

## Workflow principal

O fluxo obrigatório está documentado em `05-workflows/provisionamento-blog.md`: criar e validar o Gestor Editorial / Redator Chefe antes de provisionar o banco; depois salvar os handoffs, entregar o BigWriter Handoff ao gestor e deixar frontend/AdSense sob seu controle

A rotina diária de cada blog prevê 2 artigos, pesquisa de tendências e SEO, no mínimo 4 pontos de pauta, meta de 1.300 palavras, 1 anúncio afiliado, 1 anúncio de produto e envio obrigatório como `draft`
