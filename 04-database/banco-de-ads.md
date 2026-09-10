# Banco de Ads por blog

## Objetivo

Manter o inventário de anúncios disponíveis para cada blog, garantindo que todo artigo enviado como draft tenha dois anúncios definidos: um de afiliado e um de produto/comercial, quando houver disponibilidade e pertinência editorial.

## Decisão de arquitetura

O Banco de Ads pertence ao schema isolado de cada blog e referencia o FBR Ads como núcleo central de criativos, campanhas e métricas. Não criar um banco físico independente por blog nem duplicar o cadastro central de anúncios.

## Entidades mínimas

### `ad_inventory`

Catálogo de oportunidades que podem ser vinculadas a artigos:

- `id`
- `blog_id`
- `ad_type`: `affiliate` ou `product`
- `title`
- `description`
- `destination_url`
- `affiliate_network`
- `affiliate_tag`
- `disclosure_text`
- `niche`
- `keywords`
- `source_url`
- `source_checked_at`
- `valid_until`
- `status`: `candidate`, `approved`, `active`, `paused`, `expired`
- `fbr_ads_id`, quando houver criativo ou campanha no FBR Ads
- `created_at`, `updated_at`

### `article_ads`

Vínculo entre artigo e anúncios selecionados:

- `id`
- `article_id`
- `ad_inventory_id`
- `slot`: `affiliate` ou `product`
- `position`
- `reason`
- `approved`
- `created_at`

## Regras

- Cada artigo deve receber exatamente um anúncio `affiliate` e um anúncio `product` no checklist de draft, ou registrar um bloqueio explícito quando um tipo pertinente não estiver disponível
- O anúncio precisa ter URL, origem, status e data de verificação
- Conteúdo afiliado precisa conter disclosure compatível com o programa utilizado
- O artigo não pode inserir produto apenas para preencher slot; relevância editorial é obrigatória
- O Gestor Editorial seleciona e justifica os anúncios
- Gabe verifica claims, links, disclosure e pertinência no QA
- O FBR Ads fornece criativos, disponibilidade e métricas quando o anúncio for comercial
- Publicação, ativação de campanha ou alteração de verba permanece dependente de aprovação humana

## Critério de aceite

Um draft só passa nesta etapa quando possui dois vínculos válidos, um de cada tipo, ou um bloqueio documentado com motivo, responsável e próximo passo
