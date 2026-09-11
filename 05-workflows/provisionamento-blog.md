# Workflow de provisionamento de blog

## Objetivo

Criar um blog temático completo sem iniciar o provisionamento do banco antes de existir um Gestor Editorial individual, com identidade, skills, permissões e contexto operacional definidos.

## Ordem obrigatória

```text
1. Receber e validar briefing do novo blog
2. Criar o profile Hermes do Gestor Editorial / Redator Chefe
3. Configurar identidade, nicho, voz, marca, skills e frequência editorial
4. Validar que o gestor responde e possui acesso ao kit operacional
5. Provisionar o banco no GestaoDB / Control Tower com custom_base
6. Ler e salvar o control-tower-developer-doc
7. Ler e salvar o frontend-adsense-handoff
8. Ler e entregar o bigwriter-handoff ao gestor do blog
9. Vincular o gestor ao projeto, schema e documentos
10. Criar o primeiro plano editorial e submeter a aprovação
11. Liberar execução do blog após os gates obrigatórios
```

## Regra de bloqueio

O passo 5 é bloqueado se o Gestor Editorial não existir, não estiver associado ao blog ou não tiver passado pela verificação de identidade e acesso. Nunca provisionar o banco primeiro para tentar criar o gestor depois.

## Etapa 1 — Intake

Registrar antes da criação do gestor:

- nome e slug do blog
- nicho principal e assuntos relacionados
- público, idioma e região
- domínio e frequência de publicação
- tom, personalidade e regras editoriais
- identidade visual inicial
- categorias e tipos de conteúdo
- política de comentários e assuntos sensíveis
- frequência do Radar de Afiliados
- veículos que poderão receber FBR Ads
- responsável humano e critérios de aprovação

## Etapa 2 — Criação do gestor

O FBR Blogs deve criar um profile individual para o blog contendo:

- nome e título do Gestor Editorial / Redator Chefe
- SOUL.md com nicho, voz, limites e responsabilidades
- skills compartilhadas de governança, handoff, evidências e fontes
- skills individuais de pesquisa, redação, SEO, comentários, Amazon Associates e imagens
- skill `radar-afiliados` com frequência configurável
- acesso ao bundle editorial do blog
- diretório de trabalho e identificação do projeto ainda sem schema provisionado

O gestor deve responder a uma checagem inicial com seu nome, nicho, responsabilidades, próximos passos e status `aguardando banco`.

## Etapa 3 — Provisionamento

Somente após a validação do gestor, executar o Control Tower:

```json
{
  "name": "Nome do Blog",
  "slug": "slug_do_blog",
  "business_type": "custom",
  "template_key": "custom_base",
  "domain": null,
  "language": "pt",
  "organization_slug": "gestaodb"
}
```

Registrar ID, `schema_name`, status, data, responsável e evidência da resposta `201` ou equivalente. Se o projeto já existir, parar e executar reconciliação por slug, nunca criar duplicado.

## Etapa 4 — Distribuição dos handoffs

### Developer Doc

Salvar em:

```text
03-arquitetura/control-tower-developer-doc.md
```

O Dev recebe acesso ao documento e às configurações do novo schema por meio do ambiente seguro do projeto. Credenciais reais nunca entram no repositório, frontend ou mensagem do bot; o documento deve conter placeholders ou referências ao secret manager.

### Frontend & AdSense Handoff

Salvar em:

```text
06-design/frontend-adsense-handoff.md
```

O Gestor Editorial controla a execução: transforma o handoff em jobs para o Dev e Design, acompanha critérios de aceite e encaminha para revisão. O gestor não publica alterações irreversíveis sem o gate humano aplicável.

### BigWriter Handoff

Salvar em:

```text
05-workflows/bigwriter-handoff.md
```

Entregar ao profile do Gestor Editorial como contexto operacional do blog. A entrega deve registrar data, destinatário, projeto, schema, artefato e status de leitura/aceite. O handoff não deve ser enviado ao gestor antes de ele existir.

## Etapa 5 — Primeira execução

O gestor deve:

1. confirmar que recebeu o BigWriter Handoff
2. confirmar acesso ao developer-doc e frontend-adsense-handoff
3. montar a primeira pauta com fontes e critérios de aceite
4. solicitar pesquisa de oportunidade e pauta afiliada conforme frequência definida
5. distribuir jobs ao time da FBR Agency
6. consolidar a entrega e encaminhar ao Gabe para QA quando houver impacto
7. aguardar aprovação humana antes de publicar

## Gates obrigatórios

- Gestor criado e testado antes do banco
- Slug e template validados
- Projeto e schema confirmados no Control Tower
- Handoffs salvos nos diretórios corretos
- BigWriter Handoff entregue ao gestor
- Credenciais mantidas fora do código e dos documentos compartilháveis
- Conteúdo, anúncios e respostas públicas revisados conforme risco
- Publicação e alterações irreversíveis aprovadas por Sergio

## Falhas e recuperação

- Gestor não criado: bloquear provisionamento
- Banco criado sem gestor: marcar incidente de workflow, criar o gestor imediatamente e não liberar execução
- Handoff ausente: bloquear o próximo job dependente
- Schema ou projeto inconsistente: parar, registrar evidência e escalar para Kora/Íris
- Credencial ausente: não copiar ou inventar valor; solicitar configuração no secret manager
- Control Tower indisponível: manter o gestor em `aguardando banco`, sem criar banco alternativo local

## Critério de workflow correto

O workflow só pode ser marcado como pronto quando um teste criar um gestor, provisionar um projeto, salvar os três handoffs, entregar o BigWriter Handoff ao gestor e demonstrar que a primeira execução começa com o contexto correto e os gates ativos

## Fluxo básico de criação de um blog temático

Exemplo de solicitação: `Criar um blog sobre Cinema`

### 1. Coordenação inicial pela Íris

A Íris recebe o briefing, confirma nicho, público, idioma, domínio, identidade editorial, frequência, critérios de aceite e responsável humano. Em seguida, cria os jobs e as dependências no fluxo do projeto.

### 2. Ações paralelas após o intake

- **Théo:** inicia as ações técnicas de criação, prepara o scaffold, valida requisitos de provisionamento e conduz a integração do novo blog com o banco e o FBR Ads
- **Kora:** cria o project plan, backlog, sprint inicial, responsáveis, prazos, dependências, riscos e critérios de conclusão

Essas ações podem ocorrer em paralelo, mas o provisionamento só pode avançar depois que o perfil do Gestor Editorial for criado e validado.

### 3. Criação do Gestor Editorial / Redator Chefe

O FBR Blogs cria o gestor individual do blog, configura sua identidade, nicho, voz, skills, frequência do Radar de Afiliados, acesso aos handoffs e vínculo ao projeto. A primeira tarefa do gestor é preparar a pauta e coordenar a produção de 10 artigos inaugurais.

### 4. Provisionamento e handoffs

Após a validação do gestor, Théo executa ou acompanha o provisionamento `custom_base` no Control Tower. O sistema salva o `developer-doc`, o `frontend-adsense-handoff` e o `bigwriter-handoff` nas pastas do projeto e entrega o BigWriter Handoff ao gestor.

### 5. Produção coordenada de lançamento

- **Gestor Editorial / Redator Chefe:** coordena a pauta dos 10 artigos, pesquisas, produção, revisão, comentários e calendário editorial
- **Caio:** escreve a copy de lançamento do blog, incluindo posicionamento, apresentação, chamadas e CTAs aprovados
- **Lia:** cria a identidade visual customizada, paleta de cores, logo, hero, elementos de interface e regras visuais
- **Vito:** administra os perfis de Redes Sociais, define pilares, formatos, calendário e adaptações por plataforma; produz vídeos, Reels, Stories, Shorts e os primeiros posts derivados da estratégia de lançamento; acompanha métricas, assets, licenças e evidências
- **Rick:** pesquisa produtos potenciais para Amazon Associates, aplica `radar-afiliados` e entrega oportunidades, pautas, disclosures e fontes
- **Rafa:** analisa tráfego orgânico e pago, canais, públicos, tracking, hipóteses de teste e plano inicial de aquisição
- **Gabe:** revisa evidências, SEO, conformidade, assets, claims e prontidão antes de qualquer publicação

### 6. Ordem de dependências

```text
Briefing → Íris
Íris → Théo + Kora
Íris → criação do Gestor Editorial
Gestor validado → provisionamento do banco
Provisionamento → developer-doc + frontend-adsense-handoff + bigwriter-handoff
BigWriter Handoff → Gestor Editorial
Gestor → pauta de 10 artigos
Caio + Lia + Vito + Rick + Rafa → produção coordenada
Gabe → QA e gates
Sergio → aprovação de publicação, mídia e ações irreversíveis
```

### 7. Critério de conclusão do lançamento

O blog só pode ser considerado pronto para lançamento quando o gestor estiver ativo, o banco e o schema estiverem confirmados, os três handoffs estiverem entregues, os 10 artigos estiverem em estado definido, a identidade visual e os canais iniciais estiverem documentados, o plano de tráfego estiver revisado e os gates humanos tiverem sido cumpridos

## Rotina diária do Gestor Editorial

Cada blog ativo deve produzir **2 artigos por dia**. O Gestor Editorial é o responsável pelo resultado, a Kora controla os cards e o fluxo abaixo deve ser repetido para cada artigo.

### Etapa 1 — Tendências, contexto e SEO

Pesquisar tendências relevantes do nicho, acontecimentos que possam afetar a indústria e assuntos relacionados ao blog. Registrar fontes, data de acesso, contexto, intenção de busca, palavra-chave principal, termos secundários e perguntas associadas. Bia pode executar a pesquisa especializada e o Gestor valida a pertinência editorial.

### Etapa 2 — Pauta e pontos principais

Definir o assunto final, ângulo, público, intenção do leitor e os pontos que serão abordados. A pauta deve conter no mínimo **4 bullet points** de desenvolvimento, cada um com objetivo claro e fonte ou hipótese identificada.

### Etapa 3 — Gancho e contextualização

Criar o gancho inicial e a contextualização histórica ou factual que sustentará o artigo. O gancho deve ser coerente com a promessa do título, e a contextualização deve distinguir fato verificado de interpretação.

### Etapa 4 — Título, subtítulos e estrutura SEO

Criar título, slug e subtítulos indexados a partir dos parâmetros coletados na Etapa 1. Validar hierarquia de headings, intenção de busca, clareza, ausência de clickbait enganoso, meta description, links e termos relevantes.

### Etapa 5 — Texto do artigo

Produzir um artigo com meta de **1.300 palavras**, distribuídas entre gancho, contextualização, desenvolvimento dos subtítulos e fechamento. O texto deve conter os quatro ou mais pontos da pauta, fontes verificáveis, transições claras, conclusão útil e separação entre fatos, hipóteses e opiniões.

A contagem deve ser conferida no draft. Artigos significativamente fora da meta retornam para ajuste antes do próximo gate, salvo justificativa editorial registrada no card.

### Etapa 6 — Seleção de anúncios

Definir os dois anúncios do artigo usando o Banco de Ads do blog:

- **1 anúncio de afiliado:** produto pertinente, origem verificada, URL válida e disclosure obrigatório
- **1 anúncio de produto/comercial:** item ou campanha pertinente, criativo ou referência no FBR Ads e status verificável

O Gestor Editorial justifica a pertinência de cada anúncio. Gabe verifica claims, links, disclosure e conformidade; se um dos tipos não estiver disponível, o artigo fica bloqueado com motivo e próximo passo, não recebe anúncio artificial.

### Etapa 7 — Envio como draft

Enviar o artigo como `draft`, nunca como publicado. O card da Kora deve conter pauta, fontes, termos SEO, contagem de palavras, anúncios vinculados, artefato, riscos, responsável e status do próximo gate.

## Fluxo diário entre os agents

```text
Kora cria 2 cards por blog/dia
→ Gestor Editorial define pauta e coordena
→ Bia pesquisa tendências, fontes e termos SEO
→ Gestor aprova o ângulo e os 4+ pontos
→ Gestor/Caio produzem gancho, estrutura e texto de 1.300 palavras
→ Gestor seleciona 1 anúncio afiliado + 1 anúncio de produto
→ Gabe verifica SEO, fontes, claims, links, disclosure e ads
→ Gestor envia como draft
→ Kora registra a entrega e encaminha pendências
→ Sergio aprova qualquer publicação ou ação comercial de risco
```

## Critérios de aceite do draft diário

- [ ] Exatamente 2 artigos foram planejados para o dia
- [ ] Tendências, contexto, fontes e termos SEO estão registrados
- [ ] Pauta contém no mínimo 4 bullet points
- [ ] Gancho e contextualização foram criados
- [ ] Título, slug e subtítulos atendem à estrutura SEO
- [ ] Texto está próximo da meta de 1.300 palavras e contém fechamento
- [ ] Há 1 anúncio afiliado e 1 anúncio de produto pertinentes, ou bloqueio documentado
- [ ] Links, disclosures, claims e imagens foram verificados
- [ ] Artigo foi enviado como `draft`
- [ ] Card da Kora contém artefato, evidências, status, riscos e próximo responsável

## Regra de publicação

A rotina diária termina no estado `draft`. Publicação, ativação de anúncios, alteração de verba e qualquer comunicação pública seguem os gates de Gabe e a aprovação humana de Sergio quando aplicável

## Segurança de configuração por blog

A entrega de variáveis segue obrigatoriamente o método documentado em `03-arquitetura/metodo-seguro-de-secrets.md`. As aprovações transversais seguem o ADR-0004 do FBR Agency Flux em `F:\Projetos\_Sistemas\BigFlux\docs\architecture\project-decisions\ADR-0004-formal-approval-gates.md`. O fluxo cria um namespace por `project_id`, registra apenas referências, injeta valores no runtime do Easypanel e nunca coloca secrets em chat, Git, skills, SOUL.md, handoffs ou logs.
A ordem operacional é:

```text
manager validated
→ Control Tower project readback
→ namespace
→ binding
→ runtime validation
→ handoffs
→ release
```

A implementação usa o contrato oficial do Secret Manager Control Tower (`/secrets/namespaces`, `/secrets/bindings`, `/secrets/namespaces/{project_id}`, `/secrets/validate/{project_id}`, `/secrets/rotate`, `/secrets/revoke`) com headers autenticados e respostas somente de metadados/`secret_refs`. Não há valores nos payloads de binding, receipts ou handoffs. Rotação e revogação exigem contexto de operador autorizado e não são expostas por rotas públicas. Easypanel continua uma boundary explícita: sem contrato oficial, produção falha fechado e não há HTTP presumido

Sem namespace, injeção e health check confirmados, o blog permanece bloqueado e não pode publicar, executar integração privada ou ser marcado como pronto

## Estado da implementação

A camada de referência foi implementada no FBR Blogs: namespace determinístico `fbr/blogs/<project_id>/`, `secret_refs`, receipt e `.env.example` seguro. O provider local é reference-only e não cria valores. O adapter Easypanel falha fechado sem contrato oficial documentado e não chama endpoints presumidos. A validação de injeção real e a mutação no Easypanel permanecem pendentes
