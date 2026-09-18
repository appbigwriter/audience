# Contrato Authority Engine → FBR Blogs → Agency Flux → Control Tower

- **Status:** auditoria baseada no `GLOBAL-FLOW-AUTHORITY-BLOGS-FLUX-CONTROL-TOWER.md`
- **Projeto:** FBR Blogs
- **Task:** BLOG-20260918-AUTH-FLUX-CONTRACT-001
- **Owner:** David
- **Data:** 2026-09-18
- **Escopo:** identificar entradas necessárias para criar um blog derivado de uma Persona aprovada e capacidades necessárias para o Agency Flux gerir o ciclo completo.
- **Regra:** este documento não autoriza migration remota, publicação, DNS, gasto ou alteração externa.

## 1. Baliza adotada

A fonte transversal é:

```text
F:\Projetos\_FBR\AuthorityEngine\GLOBAL-FLOW-AUTHORITY-BLOGS-FLUX-CONTROL-TOWER.md
```

Ela define:

- Authority Engine como fonte canônica da Persona;
- Agency Flux como orquestrador durável;
- FBR Blogs como consumidor editorial;
- Control Tower como provisionador técnico;
- comunicação somente por API oficial, eventos assinados, readbacks e Handoffs versionados;
- uma Persona podendo originar vários blogs;
- publicação somente após aprovação integral de Sergio;
- ausência de leitura direta de tabelas internas entre módulos.

## 2. Fatos verificados no estado atual

### 2.1 Authority Engine

**Confirmado:** `09-codigo/src/persona-domain.ts` já possui o núcleo de uma Persona versionada:

- `Persona` com `id`, `projectId`, `ownerId`, `currentVersionId` e `status`;
- `PersonaVersion` com número de versão, snapshot, `sourceRunIds` e `contentHash`;
- `PersonaVersionSnapshot` com `CharacterBible`, `PhysicalIdentityBible`, `VisualConsistencyProfile`, `EditorialProfile` e `ChannelPlan[]`;
- planos obrigatórios para `blog`, `social` e `youtube`;
- transições versionadas com ator, motivo, timestamp e invalidação;
- validação de completude antes de criar uma versão.

**Confirmado:** o snapshot já carrega a maior parte do conteúdo exigido pelo Global Flow:

- identidade, tese, promessa, valores e tensões;
- voz e vocabulário;
- claims e guardrails;
- disclosure de IA;
- prompts visuais;
- identidade física e âncoras de continuidade;
- posicionamento, audiência, pilares, formatos e cadência;
- plano específico por canal.

**Bloqueado/não confirmado:** o contrato HTTP público ainda documenta apenas `/api/state`, `/api/opportunities`, `/api/seeds`, `/api/profiles`, `/api/content` e `/api/approvals` em `03-arquitetura/api-contract-v0.1.md`. O próprio documento declara autenticação não implementada, JSON Store local e integração externa não configurada.

**Bloqueado/não confirmado:** não existe, no contrato consultado, uma API oficial para:

- consultar uma Persona aprovada por `persona_id` e `persona_version_id`;
- consultar o snapshot imutável que será herdado pelo blog;
- registrar `blog_id` derivado;
- emitir/ler uma outbox de eventos assinados;
- fazer o Flux confirmar o processamento de `persona.approved`.

### 2.2 FBR Blogs

**Confirmado:** `09-codigo/lib/index.ts` recebe atualmente apenas:

```ts
{
  name,
  slug,
  niche,
  language,
  voice,
  domain?,
  secretVariableNames?
}
```

**Confirmado:** `BlogService.createBlog()` hoje:

1. salva o blog;
2. cria e valida um Gestor Editorial via Hermes;
3. provisiona um projeto genérico `custom_base` via Control Tower;
4. provisiona referências de secrets;
5. salva três handoffs genéricos;
6. retorna `projectId`, `schemaName`, namespace e receipts.

**Bloqueio principal:** o FBR Blogs ainda não recebe nem persiste:

- `persona_id`;
- `persona_version_id`;
- snapshot da Persona ou referência resolvível à versão aprovada;
- `blog_name_version_id`;
- `domain_version_id`;
- `tenant_id` do Flux;
- `flux_project_id`;
- `correlation_id`, `causation_id` e `event_id`;
- status de aprovação e gate de origem;
- metadados de geração da Persona;
- planos de social e YouTube;
- hash do snapshot recebido;
- versão do contrato de entrada.

**Confirmado:** `04-database/schema.sql` contém somente `blog_config`, `blog_agents`, `editorial_jobs`, `handoff_deliveries`, `workflow_events` e `ad_inventory`. Não contém as entidades previstas pelo Global Flow:

- `blog_applications`;
- `blog_persona_bindings`;
- `editorial_profiles`;
- `editorial_pillars`;
- `social_channel_plans`;
- `youtube_channel_plans`;
- versionamento de nome/domínio;
- inbox/idempotência de eventos;
- readbacks para o Flux;
- artifacts de configuração;
- estados de DNS e publicação.

**Bloqueio de segurança:** `app/api/blogs/route.ts` expõe `POST /api/blogs` sem autenticação de serviço, assinatura de evento, verificação de aprovação ou chave idempotente visível no contrato.

**Bloqueio de integração:** o adapter do Control Tower lê/provisiona projeto, schema e handoffs, mas o fluxo atual não implementa a cadeia completa definida pelo Global Flow: nome/domínio versionados, `awaiting_dns`, confirmação manual, verificação técnica, artefatos públicos, readback do health e retorno estruturado para o Flux.

### 2.3 Agency Flux

**Confirmado:** o Flux possui:

- autenticação por sessão e roles em `src/lib/auth.ts`;
- `coordinator` necessário para POST de intake e handoffs;
- read scopes explícitos por `tenantId/projectId` em `src/lib/read-scope.ts`;
- entidades locais para projects, cards, jobs, approvals, gates, events, handoffs, artifacts, blockers e jobs;
- receipts e correlation IDs em operações locais;
- API de intake Markdown em `/api/flux/intake`;
- API de handoffs em `/api/flux/handoffs`;
- API de jobs, blockers, gates e snapshot.

**Bloqueio principal:** o intake atual espera um briefing Markdown e cria um plano local. O Flux ainda não possui, nos arquivos verificados, um inbox específico para o envelope `persona.approved` do Authority Engine nem um adapter verificado que invoque a API do FBR Blogs para provisionamento.

**Bloqueio de produção:** as rotas verificadas usam sessão/actor local e a documentação do projeto afirma que persistência externa, dispatcher e integrações reais continuam dependentes de contrato e credenciais seguros. Portanto, o fluxo local não prova gestão remota do FBR Blogs.

**Gap de escopo:** a função de snapshot do Flux já exige escopos `tenantId/projectId`, mas o FBR Blogs ainda não grava o par que permitiria ao Flux consultar o blog sem reconstruir contexto.

## 3. O que o FBR Blogs precisa receber do Authority Engine

O input de criação não deve mais ser um formulário solto de `name/slug/niche`. Deve ser um pacote versionado ou uma referência resolvível para o pacote aprovado.

### 3.1 Identidade do contrato

Obrigatório:

```text
contract_version
persona_id
persona_version_id
persona_version
persona_status = approved
persona_snapshot_hash
source_run_ids
authority_project_id
owner_id
```

### 3.2 Aprovação e rastreabilidade

Obrigatório:

```text
persona_approval_id
approved_by
approved_at
approval_scope
approval_comment
approved_versions
correlation_id
causation_id
source_event_id
```

O FBR Blogs deve rejeitar o pacote se a Persona não estiver `approved`, se a versão não bater com o hash ou se faltar a aprovação explícita.

### 3.3 Dados editoriais herdados

Obrigatório para a configuração do blog:

```text
persona_name
bio
origin_story
mission
positioning
central_promise
audience
pain_points
desires
fears
objections
values
personality
voice
vocabulary
recurring_expressions
editorial_pillars
priority_topics
prohibited_topics
guardrails
quality_criteria
review_criteria
```

### 3.4 Character Bible e direção visual

Obrigatório para a instância visual/editorial:

```text
character_bible
physical_identity_bible
visual_consistency_profile
avatar_reference_asset_ids
visual_prompts
negative_prompts
ai_disclosure
channel_bios
```

O blog não precisa gerar a identidade da Persona novamente. Deve herdar uma versão aprovada e registrar a origem.

### 3.5 Plano do canal Blog

Obrigatório:

```text
channel = blog
objective
audience
formats
cadence
pillars
disclosure
constraints
plan
```

O Blog deve converter esse plano em `editorial_profiles`, `editorial_pillars` e regras para `editorial_jobs`.

### 3.6 Social e YouTube

Na primeira fase, o Blog não cria contas reais. Deve receber e registrar somente:

- `social_channel_plan_version_id`;
- `youtube_channel_plan_version_id`;
- objetivos, formatos, cadência, pilares, disclosure e restrições;
- status `configured` ou `planned`;
- ausência explícita de autorização para criação de contas.

## 4. O que precisa ser adicionado ao FBR Blogs

### P0 — contrato e segurança de entrada

1. Criar um schema de input versionado `AuthorityPersonaBindingInput`.
2. Trocar o POST público atual por uma rota de serviço autenticada para provisionamento derivado.
3. Validar assinatura/autenticidade do evento ou consultar a API oficial do Authority.
4. Exigir `idempotency_key`/`event_id` único por consumidor.
5. Rejeitar Persona não aprovada ou versão/hash divergente.
6. Persistir o envelope sem secrets e sem tokens.
7. Produzir receipt sanitizado para o Flux.

### P0 — persistência mínima

Adicionar, após revisão do MP-000 e Gate de Sergio, entidades equivalentes a:

```text
blog_applications
blog_persona_bindings
editorial_profiles
editorial_pillars
social_channel_plans
youtube_channel_plans
blog_name_versions
blog_domain_versions
integration_inbox_events
integration_readbacks
configuration_artifacts
workflow_events
```

`blog_persona_bindings` deve conter pelo menos:

```text
id
blog_id
persona_id
persona_version_id
snapshot_hash
binding_status
bound_at
bound_by
source_event_id
correlation_id
created_at
```

### P0 — ciclo de vida do blog

Implementar os estados do Global Flow:

```text
draft
awaiting_persona_approval
awaiting_blog_name_approval
domain_generated
awaiting_dns
dns_manual_confirmed
dns_verified
ready_for_provisioning
provisioning
provisioned
awaiting_publication_approval
published
blocked
failed
archived
```

Cada transição deve registrar estado anterior, estado novo, ator, motivo, timestamp, correlation ID e evidência/erro sanitizado.

### P1 — nome, slug e domínio

1. Criar `blog_name_versions`.
2. Gerar slug técnico a partir do nome aprovado.
3. Gerar domínio inicial `<slug>.fbr.news`.
4. Criar `blog_domain_versions`.
5. Permitir alteração sem criar novo `blog_id`.
6. Registrar `domain_generated`, `awaiting_dns`, `dns_manual_confirmed` e `dns_verified`.
7. Expor readback técnico de DNS e `/health` ao Flux.

### P1 — API operacional para o Flux

O FBR Blogs precisa oferecer contrato oficial, autenticado e idempotente, no mínimo:

```text
POST /api/integrations/flux/blog-provisioning
GET  /api/integrations/blogs/{blog_id}
GET  /api/integrations/blogs/{blog_id}/readback
GET  /api/integrations/blogs/{blog_id}/editorial-config
POST /api/integrations/blogs/{blog_id}/events
POST /api/integrations/blogs/{blog_id}/publication-gate
```

O POST de provisionamento deve retornar somente metadados:

```json
{
  "blog_id": "uuid",
  "persona_id": "uuid",
  "persona_version_id": "uuid",
  "project_id": "uuid",
  "tenant_id": "tenant",
  "control_tower_project_id": "uuid",
  "schema_name": "custom_slug",
  "domain": "slug.fbr.news",
  "status": "provisioning",
  "correlation_id": "uuid",
  "receipt_id": "uuid"
}
```

### P1 — callbacks/readbacks para o Flux

O Blog deve informar ao Flux, por evento ou consulta, pelo menos:

```text
blog_application.received
blog.persona_bound
blog.domain_generated
blog.dns_manual_confirmed
blog.dns_verified
blog.provisioning_started
blog.provisioned
blog.health_verified
blog.configuration_ready
blog.publication_approval_requested
blog.blocked
blog.failed
```

Cada evento deve ter `event_id`, `event_type`, `event_version`, `occurred_at`, `source`, `aggregate_type`, `aggregate_id`, `aggregate_version`, `correlation_id`, `causation_id` e payload sem secrets.

### P1 — gestão editorial

O FBR Blogs precisa transformar a Persona recebida em configuração operacional:

- perfil editorial;
- pilares;
- temas permitidos/proibidos;
- cadência;
- formatos;
- disclosure;
- critérios de qualidade;
- planos social/YouTube;
- jobs editoriais vinculados ao `persona_version_id`;
- drafts com fontes, evidência, versão e gate.

Uma alteração crítica da Persona deve invalidar a configuração dependente e retornar o blog para revisão, nunca atualizar silenciosamente o blog ativo.

### P2 — publicação e aprovação integral

Antes da publicação, o Blog precisa entregar ao Flux um pacote versionado contendo:

```text
persona_version_id
blog_name_version_id
domain_version_id
control_tower_project_id
schema_name
provisioning_job_id
health_readback_id
configuration_artifact_ids
secret_binding_ids
social_channel_plan_version_id
youtube_channel_plan_version_id
```

A aprovação deve registrar `approved_by`, `approved_at`, `approval_scope`, `approval_comment` e `approved_versions`. Um booleano isolado não atende ao Global Flow.

## 5. O que precisa ser adicionado ao Agency Flux

Embora a implementação principal desta tarefa seja no FBR Blogs, o Flux precisa fornecer a camada de gestão:

1. Inbox para eventos Authority assinados.
2. Deduplicação por `event_id + consumer`.
3. Job idempotente por Persona, versão e blog.
4. Persistência de `received_at`, `processed_at`, `status`, `attempt_count`, `last_error` e `next_retry_at`.
5. Estados `waiting_external`, `retrying`, `blocked`, `success` e `failed`.
6. Adapter autenticado para a API do FBR Blogs.
7. Readback após cada escrita.
8. Card, job, handoff, blocker e receipt vinculados por `tenantId`, `projectId`, `persona_id`, `blog_id` e `correlation_id`.
9. Gate G6 com snapshot integral antes do estado `published`.
10. Escopo de leitura configurado para o par real `tenantId/projectId` do blog.

## 6. O que precisa ser adicionado ao Authority Engine

1. API oficial de consulta de Persona e versão aprovada.
2. API/outbox para evento `persona.approved`.
3. Registro de blogs derivados e `blog_name_version_id`.
4. Contrato assinado com versionamento de evento.
5. Metadados de geração: provider, model, model_version, prompt_version, generation_job_id e generated_at.
6. Endpoint de readback do snapshot por hash/version.
7. Invalidação explícita quando uma versão crítica mudar.
8. Separação entre Persona aprovada e autorização de provisionamento/publicação.

## 7. Papel do Control Tower

O Control Tower deve receber do Flux, não diretamente do Blog ou da Persona:

```text
flux_job_id
correlation_id
blog_id
tenant_id
approved persona/blog/domain versions
project slug/name/domain
language/template
```

Deve retornar e persistir:

```text
control_tower_project_id
schema_name
public configuration artifact
validation domain
health endpoint
namespace metadata
secret binding metadata
provisioning job
readback receipt
```

Nenhum valor de secret deve aparecer no evento, no Blog, no Flux, no download ou no log.

## 8. Matriz de responsabilidade

| Capacidade | Authority | Flux | FBR Blogs | Control Tower |
|---|---|---|---|---|
| Persona canônica | dono | consulta/orquestra | consome versão aprovada | não é fonte |
| Aprovação Persona | produz/guarda | registra gate | valida pré-condição | não decide |
| Nome do blog | proposta/versão | gate e job | aplica configuração | usa no projeto |
| Domínio/DNS | dados/versionamento | acompanha blockers | expõe readback | provisiona/valida infraestrutura |
| Projeto/schema | não executa | solicita/acompanha | consome resultado | provisiona |
| Secrets | apenas referências | audita estado | injeta runtime por referência | namespace/bindings |
| Editorial | define Persona | coordena jobs/gates | executa configuração/drafts | não executa |
| Social/YouTube | define planos | gere dependências | registra pautas/configuração | não cria contas na fase 1 |
| Publicação | não autoriza sozinho | controla gate | prepara draft | não decide |
| Auditoria/readback | origem de Persona | fonte operacional | entrega evidência editorial | entrega evidência técnica |

## 9. Classificação final

### IMPLEMENTADO

- Núcleo local de Persona versionada no Authority Engine.
- Validação de completude de Persona e planos por canal.
- Provisionamento local do FBR Blogs com Gestor, Control Tower adapter, secrets por referência e três handoffs.
- Sessões/roles, read scopes, jobs, handoffs, blockers e receipts locais no Flux.

### NÃO CONFIRMADO

- API oficial Authority → Flux.
- Evento assinado `persona.approved`.
- API autenticada Flux → FBR Blogs.
- Persistência relacional remota da cadeia completa.
- Readback remoto entre os quatro módulos.
- DNS manual + verificação automática integrado ao fluxo.
- Gate integral versionado de publicação.

### BLOQUEADO

- Criar blogs derivados automaticamente a partir de Personas aprovadas.
- Fazer o Flux gerir o blog sem reconstruir contexto manualmente.
- Garantir idempotência transversal entre Authority, Flux, Blogs e Control Tower.
- Declarar o fluxo pronto para produção.

### ROADMAP ORDENADO PELO GLOBAL FLOW

1. Atualizar os quatro MP-000s com este contrato.
2. Fechar envelope de evento e autenticação serviço-a-serviço.
3. Fechar schemas e ownership das migrations.
4. Implementar Authority API/outbox.
5. Implementar Flux inbox/job/adapter/readback.
6. Implementar binding e configuração derivada no FBR Blogs.
7. Implementar nome/domínio/DNS e readbacks.
8. Implementar Control Tower automático e reconciliador.
9. Executar E2E local sem publicação real.
10. Obter Gate de Sergio para migrations/deploy/readback remoto.
11. Executar piloto controlado.

## 10. Critério de aceite para considerar o FBR Blogs pronto para esse fluxo

O FBR Blogs só deve ser classificado como integrado quando um teste E2E reproduzir, sem publicação real:

1. Persona aprovada recebida com versão/hash válidos;
2. Evento processado uma única vez;
3. Blog criado sem duplicidade;
4. Nome, slug e domínio versionados;
5. Estado DNS acompanhado e readback verificável;
6. Persona vinculada ao blog;
7. Plano Blog persistido;
8. Social e YouTube registrados como planos, sem contas reais;
9. Control Tower retornando projeto/schema/artifacts/secret refs;
10. Flux recebendo jobs, handoffs, blockers e receipts;
11. Health check lido de volta;
12. Pacote integral aguardando aprovação de Sergio;
13. Reprocessamento do mesmo evento sem criar segundo blog, schema ou namespace.
