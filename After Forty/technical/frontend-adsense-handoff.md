# Handoff Frontend/Adsense - After Forty by Heidi Braun

## 1. Objetivo

Definir o contrato tecnico do frontend do blog com o modulo de anuncios.
Este documento serve para o dev implementar o layout, o renderer dos blocos e a integracao com GAM, AdSense e parceiros diretos.

## 2. Identidade do projeto

- Nome: After Forty by Heidi Braun
- Slug: afterforty
- Tipo: blog
- Template: blog_standard
- Schema documentado (não verificado externamente): blog_afterforty
- Dominio: afterforty.fbr.news
- Idioma: en
- Status documental: documented_only — sem readback externo nesta auditoria

## 3. Estrutura de anuncios

O frontend deve ler a configuracao diretamente do schema provisionado do blog.

### Tabelas envolvidas

- `ad_slots`
- `direct_campaigns`
- `ad_network_partners`
- `layout_templates`
- `layout_blocks`
- `site_config`
- `theme_tokens`
- `field_bindings`

### Campos principais

- `ad_slots.slot_key`
- `ad_slots.provider`
- `ad_slots.ad_unit_id`
- `ad_slots.gam_ad_unit_path`
- `ad_slots.size_mapping`
- `direct_campaigns.partner_name`
- `direct_campaigns.creative_url`
- `direct_campaigns.click_url`
- `direct_campaigns.weight`
- `ad_network_partners.ad_network_line`

## 4. Regras de renderizacao

- O layout raiz deve carregar o GPT uma unica vez.
- Cada slot deve ser renderizado a partir do banco, sem hardcode por blog.
- Ao navegar entre rotas client-side, o slot anterior deve ser destruido antes de criar o novo.
- O frontend nao deve depender de arquivo estatico por blog para configurar anuncios.
- `ads.txt` deve ser servido de forma central a partir da configuracao do dominio.

## 5. Contrato do slot

### Exemplo de mapeamento esperado

```json
{
  "slot_key" <secret-ref:runtime>
  "provider": "gam",
  "ad_unit_path": "/1234567/fbr-blog/sidebar_top",
  "sizes": [[300,250],[336,280]],
  "min_height": 280
}
```

### size_mapping

O campo `size_mapping` deve suportar uma lista de faixas por viewport.

```json
[
  { "viewport": [0, 0], "sizes": [[300, 250]] },
  { "viewport": [768, 0], "sizes": [[300, 250], [336, 280]] }
]
```

## 6. Direcao para parceiros diretos

- `direct_campaigns` deve controlar banners diretos fora do leilao principal.
- O frontend deve fazer rotacao por peso quando houver mais de uma campanha ativa no mesmo slot.
- O tracking de impressao e clique deve apontar para endpoint proprio do projeto.

## 7. ads.txt

O arquivo `ads.txt` deve ser gerado a partir de `ad_network_partners`.
Cada parceiro deve fornecer a linha exata de declaracao, e o frontend deve publicar o conteudo atualizado sem deploy manual por blog.

## 8. Regras de schema

- Nao alterar `public`.
- Nao misturar config de anuncios entre blogs.
- Toda personalizacao deve ocorrer no `schema_name` do projeto.
- Se o frontend precisar de novo comportamento, ajustar o schema e o renderer juntos.

## 9. Checklist para o dev

- [ ] O frontend le o schema correto.
- [ ] O GPT e inicializado uma unica vez.
- [ ] Os slots sao renderizados por configuracao.
- [ ] `size_mapping` foi interpretado corretamente.
- [ ] Campanhas diretas estao suportadas.
- [ ] `ads.txt` vem do banco.
- [ ] Nenhuma tabela de `public` foi alterada.

## 10. SQL de conferencia

```sql
select id, name, slug, business_type, template_key, schema_name, domain, status, template_version
from public.projects
where slug = 'afterforty';
```
