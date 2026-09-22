# Audience Builder — Sprints, Itens, Subitens e Stories

## Status
`PLANEJAMENTO_EM_VALIDACAO`

Este documento transforma o Projeto Conceitual do Audience Builder em uma tasklist executável. Nenhuma Story é considerada implementada por existir neste documento. A execução só começa após os Gates definidos e após o fechamento das dependências críticas do Authority Engine.

## Fonte de verdade

- Projeto Conceitual: `02-prd/PROJETO-CONCEITUAL-AUDIENCE-BUILDER.md`
- Foundation existente para análise/convergência: `MP-000-foundation.md`
- PRD legado da vertical: `02-prd/PRD-fbr-blogs.md`
- Contrato transversal existente: `03-arquitetura/authority-blogs-flux-contract.md`
- Contrato adapter existente: `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`

## Decisões desta tasklist

1. O Audience Builder é o produto estrutural principal.
2. O foundation atual será analisado para reutilização, convergência e maximização, mas não governa sozinho o novo produto.
3. Nenhum Audience Project poderá ser criado com Persona não validada pelo Authority Engine.
4. O pacote recebido do Authority deve conter Persona, versão, hash, Character Bible, Physical Identity Bible, Visual Consistency Profile, Editorial Profile, Channel Plans, guardrails e nichos/oportunidades potenciais.
5. O canal social não será escolhido antecipadamente. O sistema deverá levantar possibilidades, avaliar adequação e recomendar uma combinação de canais com base na Persona, no nicho, no público, nos formatos e nos objetivos.
6. O piloto poderá começar sem publicação social real. A descoberta, preparação e aprovação de canais são separadas da publicação.
7. O Authority Engine é pré-requisito de integração, mas o Audience Builder deve ser desenvolvível com contratos e fixtures versionados enquanto o Authority termina seus testes.
8. Nenhuma execução remota, migration, deploy, publicação, gasto, criação de conta social ou uso de secret acontece sem Gate específico.

---

# Grafo de execução

```text
S0 Authority Gate
   |
   +--> S1 Foundation Analysis + AB Foundation
             |
             +--> S2 Domain, Persona Binding and Manifesto
             |       |
             |       +--> S3 Template and Visual System
             |       +--> S4 Editorial Engine
             |       +--> S5 Channel Discovery and Social Planning
             |
             +--> S6 Monetization and Analytics
             |
             +--> S7 Flux, Control Tower and Runtime Integration
                             |
                             +--> S8 Pilot E2E and QA
                                     |
                                     +--> S9 Replication and Operations
```

S3, S4, S5 e S6 podem ter execução paralela depois dos contratos de S2. S7 pode preparar adapters e contratos em paralelo, mas não pode declarar integração real sem readback. S8 depende dos contratos e fixtures das S2–S7.

---

# SPRINT S0 — Authority Gate e contrato de entrada

## Objetivo

Garantir que o Audience Builder consuma exclusivamente Personas validadas e receba um pacote completo, versionado e verificável. O Sprint não implementa novamente o Authority Engine; ele identifica o que precisa ser confirmado para integração.

## Item S0.1 — Critério de Persona válida

### Subitens
- S0.1.a Definir estados aceitos: `approved` ou equivalente canônico.
- S0.1.b Definir estados rejeitados: draft, generating, stale, rejected, archived e inexistente.
- S0.1.c Definir ator e evidência da aprovação.
- S0.1.d Definir regra de versão e `content_hash`.

### Stories

#### AB-S0-001 — Validar elegibilidade da Persona
**Objetivo:** implementar contrato que aceite somente Persona em estado aprovado.

**Aceite:**
- Persona aprovada é aceita;
- Persona não aprovada é rejeitada com razão estruturada;
- ausência de versão, hash ou aprovação é bloqueada;
- o erro não expõe secrets;
- testes cobrem estados válidos, inválidos e desconhecidos.

**Evidência:** contrato, testes unitários e tabela de estados.

#### AB-S0-002 — Validar versão imutável e hash
**Objetivo:** impedir que o Audience Builder use snapshot alterado ou versão stale.

**Aceite:**
- versão e hash são persistidos no binding;
- hash divergente bloqueia o consumo;
- mesma versão com mesmo hash é idempotente;
- mudança crítica exige novo binding/approval package.

**Evidência:** testes de igualdade, divergência e replay.

## Item S0.2 — Pacote canônico de Persona

### Subitens
- S0.2.a Definir schema do snapshot recebido.
- S0.2.b Definir Character Bible.
- S0.2.c Definir Physical Identity Bible.
- S0.2.d Definir Visual Consistency Profile.
- S0.2.e Definir Editorial Profile.
- S0.2.f Definir Channel Plans.
- S0.2.g Definir nichos potenciais e sinais de oportunidade.
- S0.2.h Definir claims, guardrails e disclosure.

### Stories

#### AB-S0-003 — Definir Persona Intake Package
**Objetivo:** documentar payload completo que o Audience Builder recebe do Authority.

**Aceite:**
- payload contém `persona_id`, `persona_version_id`, `content_hash`, status e aprovação;
- contém identidade, voz, audiência, pilares, claims e guardrails;
- contém orientação visual e planos de canais;
- contém nichos potenciais com evidência/limitação;
- cada campo tem obrigatoriedade e regra de validação.

**Evidência:** contrato versionado, exemplos válidos e inválidos.

#### AB-S0-004 — Fixture de Persona aprovada
**Objetivo:** criar fixture completa para desenvolvimento local sem fingir integração remota.

**Aceite:**
- fixture é marcada como `test-only`;
- possui versão e hash reproduzíveis;
- representa todos os campos obrigatórios;
- fixture incompleta falha na validação;
- não contém segredo nem dado externo inventado como fato.

**Evidência:** fixture, teste de carga e documentação de limites.

## Item S0.3 — Gate de integração Authority

### Stories

#### AB-S0-005 — Readiness report do Authority
**Objetivo:** registrar quais contratos do Authority estão prontos, parciais ou bloqueados para consumo.

**Aceite:**
- relatório separa fato, hipótese, bloqueio e decisão;
- testes do Authority são citados por evidência real;
- ausência de API oficial é classificada como bloqueio, não mascarada por fixture;
- owner e next check existem para cada gap.

**Evidência:** relatório em `08-historico`.

#### AB-S0-006 — Gate de liberação do Audience Builder
**Objetivo:** criar o checklist que libera ou bloqueia a criação de Audience Projects.

**Aceite:**
- Gate exige Persona aprovada;
- exige pacote versionado e hash;
- exige contrato de persistência e readback;
- permite desenvolvimento local com fixture explicitamente marcada;
- não permite produção com fixture.

**Evidência:** checklist, teste negativo e decisão registrada.

---

# SPRINT S1 — Análise da foundation e fundação própria do Audience Builder

## Objetivo

Analisar o foundation existente, aproveitar contratos úteis e produzir a fundação específica do Audience Builder, sem transformar a vertical FBR Blogs legada na estrutura final por herança.

## Item S1.1 — Matriz de convergência

### Stories

#### AB-S1-001 — Auditar MP-000 existente
**Objetivo:** classificar cada decisão do foundation como adotar, adaptar, substituir, manter como legado ou deixar em aberto.

**Aceite:**
- stack, arquitetura, schema, adapters, agentes, Gates e riscos são classificados;
- decisões incompatíveis com Audience Builder são explicitadas;
- nenhum item é marcado como adotado apenas por existir;
- gaps de persona, social, templates e Audience Project aparecem na matriz.

**Evidência:** matriz de convergência.

#### AB-S1-002 — Identificar maximizadores reutilizáveis
**Objetivo:** encontrar elementos que aumentam a capacidade do Audience Builder sem aumentar desnecessariamente o escopo.

**Aceite:**
- identifica contratos de Ads, handoffs, drafts, QA e secret refs reaproveitáveis;
- identifica duplicações e pontos que devem permanecer centralizados;
- cada recomendação tem ganho, risco e custo de adoção;
- recomendações não são tratadas como decisão automática.

**Evidência:** relatório de maximização.

## Item S1.2 — Fundação do Audience Builder

### Stories

#### AB-S1-003 — Criar MP-000 do Audience Builder
**Objetivo:** consolidar stack, arquitetura, domínio, integrações, schema, variáveis, estrutura de arquivos e critérios de fundação.

**Aceite:**
- documento possui status `draft` ou `em_validacao`;
- distingue Audience Builder de FBR Blogs legado;
- define ownership de tabelas;
- separa local, staging e produção;
- registra Authority como dependência de Persona e Flux/Control Tower como integrações governadas;
- não marca aprovação sem Sergio.

**Evidência:** `MP-000-audience-builder-foundation.md`.

#### AB-S1-004 — Definir estrutura de repositório
**Objetivo:** definir árvore `01-conceitual` a `09-codigo` e módulos do monorepo.

**Aceite:**
- cada pasta tem responsabilidade;
- domínio, adapters, UI, templates, social, editorial e contratos são separados;
- não há ownership compartilhado sem regra;
- paths permitem dois agentes trabalharem sem colisão.

**Evidência:** árvore documentada e teste de ownership.

## Item S1.3 — Contratos e governança

### Stories

#### AB-S1-005 — Contrato de estados do Audience Project
**Objetivo:** definir estados, transições, atores, evidências e bloqueios.

**Aceite:**
- estados incluem `draft`, `intake`, `persona_bound`, `planning`, `provisioning`, `active`, `paused`, `blocked`, `archived`;
- transições inválidas falham;
- cada transição registra actor, timestamp e motivo;
- publicação não é consequência automática de `active`.

#### AB-S1-006 — Matriz de ownership e Gates
**Objetivo:** definir responsabilidades de Authority, Flux, Control Tower, Blogs, Social Engine, agentes e Sergio.

**Aceite:**
- nenhuma entidade crítica fica sem dono;
- publicação, gasto, comunicação pública e secrets têm Gate explícito;
- Kora mantém o estado operacional;
- QA pode bloquear, mas não aprovar ação humana reservada.

---

# SPRINT S2 — Núcleo do Audience Project, binding de Persona e manifesto

## Objetivo

Criar o núcleo de domínio do Audience Builder, capaz de registrar um Audience Project somente a partir de Persona aprovada e de produzir um manifesto validado.

## Item S2.1 — Audience Project

### Stories

#### AB-S2-001 — Criar domínio Audience Project
**Objetivo:** modelar o objeto que conecta Persona, blog, canais, template, editorial e monetização.

**Aceite:**
- entidade possui identificadores, owner, status, nicho, objetivo e versão;
- criação exige Persona validada;
- duplicidade por slug/owner é controlada;
- regras de transição são testadas.

#### AB-S2-002 — Persistir Audience Project relacionalmente
**Objetivo:** criar persistência DB-first, com constraints, índices e RLS planejados.

**Aceite:**
- schema não depende de JSON operacional;
- tenant/project scope é obrigatório;
- constraints impedem binding inválido;
- testes cobrem isolamento e duplicidade;
- migration é versionada e não aplicada remotamente sem Gate.

## Item S2.2 — Persona Binding

#### AB-S2-003 — Associar Persona aprovada ao projeto
**Objetivo:** persistir vínculo imutável entre Audience Project e snapshot aprovado.

**Aceite:**
- grava `persona_id`, versão e hash;
- readback retorna os mesmos valores;
- versão stale é rejeitada;
- alteração crítica cria novo binding ou nova aprovação.

#### AB-S2-004 — Importar nichos potenciais
**Objetivo:** receber do Authority oportunidades/nichos potenciais sem transformá-los automaticamente em decisão editorial.

**Aceite:**
- nichos possuem origem, data, confiança e limitações;
- podem ser classificados como candidato, descartado ou em análise;
- sistema não escolhe nicho final sem regra/decisão;
- hipóteses são separadas de fatos.

## Item S2.3 — Manifesto

#### AB-S2-005 — Schema e validação do manifesto
**Objetivo:** criar manifesto versionado por Audience Project.

**Aceite:**
- manifesto valida linguagem, região, nicho, template, editorial, social e monetização;
- valores inválidos retornam erros por campo;
- manifesto é versionado;
- reprocessamento idempotente preserva a versão.

#### AB-S2-006 — Gerar pacote de configuração
**Objetivo:** gerar pacote consumível por Blog, Template Engine e Social Engine.

**Aceite:**
- pacote inclui referências, não secrets;
- contém versão do manifesto e hash;
- consumidores conseguem validar o pacote;
- pacote inválido não é publicado.

---

# SPRINT S3 — Design System, Template Engine e programação visual

## Objetivo

Construir a base visual reutilizável do Audience Builder sem gerar um clone por blog e sem permitir inconsistência visual descontrolada.

## Item S3.1 — Design tokens

#### AB-S3-001 — Modelo de Theme Manifest
**Objetivo:** representar tokens visuais por projeto/template.

**Aceite:**
- tokens cobrem cor, tipografia, espaçamento, grid, densidade, motion e acessibilidade;
- schema impede contraste/configuração inválida quando detectável;
- tokens têm versão e origem;
- preview usa os tokens reais.

#### AB-S3-002 — Resolver tokens por Persona e nicho
**Objetivo:** combinar orientação visual herdada, template escolhido e ajustes aprovados.

**Aceite:**
- herança é explícita;
- overrides são limitados e auditáveis;
- conflito gera warning ou bloqueio;
- não altera Character/Visual Bible no Authority.

## Item S3.2 — Templates

#### AB-S3-003 — Registro e versionamento de templates
**Objetivo:** registrar famílias de template e versões compatíveis.

**Aceite:**
- template possui capacidades, dependências e compatibilidade;
- versão antiga permanece identificável;
- projeto fixa a versão usada;
- atualização exige preview e aprovação.

#### AB-S3-004 — Renderizador de páginas editoriais
**Objetivo:** renderizar homepage, categoria e artigo com blocos versionados.

**Aceite:**
- renderização é determinística para o mesmo manifesto e conteúdo;
- desktop/mobile têm estados verificáveis;
- conteúdo ausente produz estado vazio tratado;
- links, headings e landmarks são acessíveis.

## Item S3.3 — Componentes e editor

#### AB-S3-005 — Catálogo de componentes de nicho
**Objetivo:** criar registry de componentes como checklist, comparação, FAQ, product card e outros.

**Aceite:**
- cada componente tem schema de entrada;
- variantes são registradas;
- componente incompatível com template é rejeitado;
- testes de renderização existem.

#### AB-S3-006 — Editor visual controlado
**Objetivo:** permitir composição visual por blocos aprovados.

**Aceite:**
- blocos podem ser ordenados;
- variantes podem ser escolhidas;
- preview responsivo funciona;
- alterações não publicam automaticamente;
- versão anterior pode ser restaurada;
- editor rejeita configuração estrutural inválida.

#### AB-S3-007 — Visual regression e accessibility checks
**Objetivo:** verificar que template e tokens não quebram a experiência.

**Aceite:**
- screenshots/representações comparáveis são geradas;
- mudanças relevantes são detectadas;
- checks de keyboard/focus/contrast têm evidência;
- falha bloqueia promoção de template.

---

# SPRINT S4 — Editorial Engine, pesquisa, SEO e mídia

## Objetivo

Operar o ciclo de conteúdo do Audience Project com fatos, fontes, SEO, mídia e drafts rastreáveis.

## Item S4.1 — Editorial Profile e calendário

#### AB-S4-001 — Configurar perfil editorial derivado
**Aceite:** voz, pilares, formatos, frequência, guardrails, idioma e disclosure são carregados da Persona e ajustáveis somente dentro do escopo.

#### AB-S4-002 — Criar calendário editorial
**Aceite:** calendário suporta pauta, owner, data, canal, status, prioridade e bloqueio; não cria publicação automática.

## Item S4.2 — Research e fontes

#### AB-S4-003 — Briefing de pesquisa
**Aceite:** briefing registra intenção, palavra primária, termos secundários, público, quatro pontos, limitações e fontes.

#### AB-S4-004 — Registro de fontes e citações
**Aceite:** URL, título, origem, data de acesso, tipo, trecho/claim relacionado e limitação são persistidos; fonte ausente bloqueia claim dependente.

## Item S4.3 — Conteúdo e revisão

#### AB-S4-005 — Draft de artigo
**Aceite:** artigo possui versão, status, título, slug, meta, outline, corpo, contagem, autor/persona e fontes; saída padrão é `draft`.

#### AB-S4-006 — Fact check e claims
**Aceite:** cada claim relevante pode ser classificado como fato, hipótese, opinião ou bloqueado; claim sem suporte não entra como fato.

#### AB-S4-007 — SEO review
**Aceite:** avaliação cobre intenção, estrutura, headings, links, schema, acessibilidade e indexação; nota SEO não aprova fatos nem publicação.

## Item S4.4 — Mídia

#### AB-S4-008 — Asset registry e direitos
**Aceite:** cada asset registra origem, licença, prompt/modelo quando aplicável, dimensões, alt text e vínculo ao conteúdo; asset sem direitos é bloqueado.

#### AB-S4-009 — Media QA
**Aceite:** verifica proporção, alt text, peso, legibilidade, consistência visual e uso permitido; falha gera blocker reproduzível.

---

# SPRINT S5 — Descoberta de canais e Social Engine

## Objetivo

Permitir que o próprio projeto avalie quais canais sociais são adequados à Persona, ao nicho, ao público, aos formatos e aos objetivos, sem fixar previamente Instagram, Pinterest, TikTok ou qualquer outro canal.

## Item S5.1 — Capability map de canais

#### AB-S5-001 — Registrar capacidades por canal
**Aceite:** cada canal possui formatos, limites, frequência, dependências, métricas, riscos e integração disponível; dados externos têm fonte/data.

#### AB-S5-002 — Registrar custos e requisitos operacionais
**Aceite:** canal registra necessidade de conta, asset, vídeo, aprovação, API, custo e esforço; ausência de contrato é bloqueio explícito.

## Item S5.2 — Modelo de adequação

#### AB-S5-003 — Definir sinais de adequação
**Aceite:** modelo considera audiência, comportamento, formato, visual, cadência, objetivo, capacidade de produção e compliance.

#### AB-S5-004 — Gerar hipóteses de canal
**Aceite:** sistema gera candidatos classificados, não decisões irrevogáveis; cada recomendação explica sinais, incertezas e dados faltantes.

#### AB-S5-005 — Comparar combinações de canais
**Aceite:** é possível comparar combinações por alcance potencial, esforço, reutilização, risco, custo e capacidade; resultado é versionado.

## Item S5.3 — Planejamento e adaptação

#### AB-S5-006 — Criar Channel Plan derivado
**Aceite:** plano contém objetivo, formatos, cadência, CTA, tom, assets, aprovação e métricas; pode ser aprovado/rejeitado.

#### AB-S5-007 — Gerar variantes por canal
**Aceite:** um conteúdo origem pode gerar variantes específicas sem copiar cegamente; cada variante mantém vínculo, versão e disclosure quando necessário.

#### AB-S5-008 — Social approval package
**Aceite:** pacote agrupa texto, mídia, canal, risco, fontes, CTA e status; publicação fica bloqueada sem Gate aplicável.

## Item S5.4 — Descoberta contínua

#### AB-S5-009 — Feedback de desempenho para recomendação
**Aceite:** métricas verificadas podem alterar a recomendação futura sem reescrever histórico; aprendizado é separado de fato e hipótese.

---

# SPRINT S6 — Monetização, ads, afiliados e analytics

## Objetivo

Integrar monetização e mensuração sem transformar relevância editorial em preenchimento artificial de slots.

## Item S6.1 — Inventário

#### AB-S6-001 — Ad inventory central
**Aceite:** item registra anunciante, tipo, destino, nicho, disclosure, validade, dimensões permitidas, status e referência FBR Ads.

#### AB-S6-002 — Affiliate recommendation
**Aceite:** item afiliado possui fonte, intenção, disclosure, validade e evidência; item irrelevante bloqueia o job.

## Item S6.2 — Binding editorial

#### AB-S6-003 — Associar monetização ao conteúdo
**Aceite:** artigo pode referenciar exatamente um affiliate e um product ad ou ficar `blocked`; formato inválido é rejeitado.

#### AB-S6-004 — Validação de disclosure
**Aceite:** disclosure é obrigatório e contextual; ausência bloqueia aprovação.

## Item S6.3 — Métricas

#### AB-S6-005 — Modelo de eventos e métricas
**Aceite:** views, cliques, conversões, origem e canal possuem eventos versionados; nenhum número é tratado como real sem origem/readback.

#### AB-S6-006 — Dashboard de performance
**Aceite:** dashboard distingue dado real, estimativa, ausência e stale; filtros por projeto, conteúdo, canal e período funcionam.

---

# SPRINT S7 — Orquestração, Control Tower e runtime

## Objetivo

Conectar o Audience Builder ao Agency Flux e ao Control Tower por contratos oficiais, preservando idempotência, segurança e readbacks.

## Item S7.1 — Jobs e handoffs

#### AB-S7-001 — Audience Builder jobs no Flux
**Aceite:** intake, binding, manifesto, template, editorial, social e provisioning são jobs rastreáveis; cada job possui owner, dependência, heartbeat, nextAction e nextCheck.

#### AB-S7-002 — Handoffs versionados
**Aceite:** handoff contém origem, destino, objetivo, artefato, decisões, blockers, Gate e aceite; envio não equivale a conclusão.

#### AB-S7-003 — Inbox/outbox e idempotência
**Aceite:** replay não duplica binding, job ou provisionamento; event_id, consumer, attempts, retry e receipt são persistidos.

## Item S7.2 — Control Tower

#### AB-S7-004 — Adapter de provisionamento
**Aceite:** adapter usa contrato oficial, valida duplicidade, envia payload explícito e não presume endpoints; mock e real são separados.

#### AB-S7-005 — Readback de projeto e schema
**Aceite:** após provisionamento autorizado, lê de volta project_id, schema, template, status e namespace; sem readback permanece pendente.

## Item S7.3 — Runtime e secrets

#### AB-S7-006 — Runtime contract do Audience Builder
**Aceite:** env é gerado por referência, classifica secret/derivada/opcional e nunca retorna plaintext ao frontend.

#### AB-S7-007 — Health, deploy e rollback contract
**Aceite:** health não é confundido com deploy; versão/hash, target, rollback e readback são registrados.

---

# SPRINT S8 — Blog-piloto, E2E e QA independente

## Objetivo

Provar o fluxo completo com uma Persona aprovada e um único Audience Project, mantendo social em modo de descoberta/preparação caso os contratos reais ainda não estejam liberados.

## Item S8.1 — Piloto

#### AB-S8-001 — Criar fixture/piloto controlado
**Aceite:** Persona aprovada ou fixture explicitamente test-only; projeto, manifesto e template possuem IDs/versionamento.

#### AB-S8-002 — Executar fluxo editorial ponta a ponta
**Aceite:** intake → research → briefing → draft → fact check → SEO → mídia → monetização → approval package funciona; resultado é draft ou blocked.

#### AB-S8-003 — Executar descoberta social
**Aceite:** sistema produz possibilidades, justificativas, dados faltantes e recomendação; nenhum canal é publicado automaticamente.

## Item S8.2 — QA

#### AB-S8-004 — QA funcional independente
**Aceite:** testa casos felizes, inválidos, stale, duplicados, sem fonte, sem licença, sem disclosure, sem Gate e sem integração.

#### AB-S8-005 — QA visual e responsivo
**Aceite:** homepage, artigo, editor e approval package são verificáveis em desktop/mobile; regressões são registradas.

#### AB-S8-006 — QA de segurança e escopo
**Aceite:** tenant isolation, RBAC, secrets, 401/403/404/409/422, idempotência e fail-closed possuem evidência.

## Item S8.3 — Gate de piloto

#### AB-S8-007 — Review GPT-5.6 do Sprint de piloto
**Critério funcional obrigatório:** “Esse recurso corresponde exatamente ao que o sistema necessita?”

**Aceite:** cada Story é classificada como passou, corrigida, parcialmente atendida ou reprovada; correções são aplicadas e reexecutadas; nenhuma Story é concluída por auto-relato.

#### AB-S8-008 — Decisão de expansão
**Aceite:** relatório compara objetivo, evidência, gaps, custo, riscos e recomendação; expansão só segue com Gate humano.

---

# SPRINT S9 — Replicação e operação contínua

## Objetivo

Transformar o piloto em processo repetível sem multiplicar clones, divergências ou risco operacional.

## Item S9.1 — Blueprint

#### AB-S9-001 — Blueprint de criação de Audience Project
**Aceite:** blueprint define entradas, validações, jobs, handoffs, Gates, outputs e rollback.

#### AB-S9-002 — Provisionamento repetível
**Aceite:** segundo projeto pode ser criado por manifesto sem copiar código; idempotência e isolamento são comprovados.

## Item S9.2 — Operação

#### AB-S9-003 — Health dashboard de projetos
**Aceite:** mostra status, jobs, blockers, heartbeats, integrações, métricas, última ação e próximo check.

#### AB-S9-004 — Monitoramento e alertas
**Aceite:** monitor verifica processos, progresso e interrupções; não conta plano, build ou auto-relato como progresso.

#### AB-S9-005 — Relatório de portfólio
**Aceite:** relatório separa projetos ativos, bloqueados, piloto, staging e produção verificada.

## Item S9.3 — Aprendizado

#### AB-S9-006 — Biblioteca de padrões por nicho
**Aceite:** padrões visuais/editoriais são versionados e não sobrescrevem fatos ou identidade de Persona.

#### AB-S9-007 — Feedback loop de canal
**Aceite:** desempenho real pode atualizar hipóteses de canal, sem alterar retroativamente decisões ou métricas históricas.

---

# Contrato de implementação multiagente

## Dois agentes

### Agente A — Domínio, persistência e integrações

**Ownership principal:**

```text
09-codigo/packages/domain/
09-codigo/packages/contracts/
09-codigo/packages/persistence/
09-codigo/packages/adapters/
09-codigo/migrations/
09-codigo/tests/domain/
09-codigo/tests/integration/
```

**Responsável por:**

- contratos;
- estados;
- Persona binding;
- manifesto;
- schema;
- RLS/RBAC;
- jobs/handoffs;
- outbox/inbox;
- adapters Authority/Flux/Control Tower;
- readbacks;
- fixtures de integração.

### Agente B — Produto, UI, templates e experiência

**Ownership principal:**

```text
09-codigo/apps/
09-codigo/packages/design-system/
09-codigo/packages/template-engine/
09-codigo/packages/editorial-ui/
09-codigo/packages/social-ui/
09-codigo/tests/ui/
09-codigo/tests/visual/
```

**Responsável por:**

- dashboard;
- onboarding;
- manifesto UI;
- editor visual;
- templates;
- design tokens;
- preview;
- approval package;
- calendário editorial;
- descoberta de canais;
- dashboards de métricas.

### Regras de colisão

- Nenhum agente altera o path exclusivo do outro sem handoff.
- Tipos compartilhados pertencem ao Agente A e são consumidos pelo B.
- Componentes visuais não criam regras de domínio próprias.
- Agente B não implementa persistência paralela em JSON.
- Agente A não substitui a superfície de operação por endpoint sem UI quando a Story exige dashboard.
- Integração final e testes completos são responsabilidade do coordenador.

---

# Protocolo de execução dos Sprints

1. Antes do dispatch, validar provider/modelo, paths de ownership, dependências e acceptance criteria.
2. Dispatchar dois agentes em tracks independentes quando houver trabalho liberado.
3. Agentes devem seguir para a próxima Story/Sprint elegível sem espera silenciosa.
4. Story bloqueada deve gerar HOLD com causa, owner do desbloqueio, nextAction, nextCheck e closure criterion.
5. A cada final de Sprint, David revisa com GPT-5.6-luna-900k, executa testes, compara o recurso com a necessidade real e corrige diretamente quando a correção não exige decisão de produto.
6. Um relatório de agente não é evidência suficiente; revisar diff, arquivos, testes e handoff.
7. Uma Story só é `concluido_validado` depois da revisão independente.
8. Authority, Control Tower, social providers e produção permanecem separados de mocks locais.
9. Nenhuma Story de publicação, gasto, secret, migration remota ou criação de conta social passa sem Gate.

## Critério de revisão por Sprint

A pergunta obrigatória é:

> **Esse recurso corresponde exatamente ao que o sistema necessita?**

A revisão deve registrar:

- requisito esperado;
- comportamento real;
- evidência;
- divergência;
- correção aplicada;
- novo teste;
- decisão pendente, se houver.

---

# Monitoramento e reporte

## Checagem a cada 30 minutos

Quando a execução for iniciada, o monitor deve verificar:

- processos/agentes ativos;
- heartbeat;
- última atividade;
- arquivos/diffs novos;
- testes executados;
- Story atual;
- blocker;
- nextAction;
- próximo check;
- interrupções reais.

Se o agente não estiver trabalhando:

1. confirmar se terminou, falhou ou ficou sem processo;
2. coletar evidência;
3. resolver o problema imediatamente quando estiver dentro do escopo;
4. registrar interrupção se não for resolvido;
5. mover o agente para a próxima Story elegível;
6. manter o item pendente com owner e next check.

Não declarar monitoramento ativo sem processo/scheduler real.

## Mensagem a cada 60 minutos

Formato exato para Telegram:

```text
Planejamento segue - x% feito, x stories pending, x interrupcoes
```

O percentual será calculado somente sobre Stories `concluido_validado`, não sobre:

- Stories planejadas;
- código escrito sem teste;
- build verde isolado;
- auto-relato de agente;
- mock confundido com integração;
- migration criada sem readback;
- publicação relatada sem leitura posterior.

A automação de Telegram só deve ser criada quando a execução for efetivamente iniciada, com destino validado e primeiro disparo verificado. Não agendar silenciosamente durante a fase de planejamento.

---

# Critérios globais de encerramento

O plano completo só poderá ser considerado concluído quando:

- Authority fornecer Persona aprovada e pacote completo;
- MP-000 do Audience Builder estiver aprovado;
- todos os contratos críticos tiverem owner e evidência;
- Audience Project for persistido com isolamento;
- manifesto e Persona binding forem versionados;
- template engine e design system forem testados;
- fluxo editorial completo funcionar;
- descoberta de canais produzir recomendação justificável;
- monetização e disclosure forem validados;
- Flux tiver jobs, handoffs, retries e readbacks;
- Control Tower tiver provisionamento verificado;
- piloto E2E tiver evidência independente;
- todas as Stories tiverem revisão GPT-5.6;
- nenhum blocker crítico permanecer sem owner, nextAction e closure criterion;
- publicação e ações externas continuarem protegidas pelos Gates.

## Estado atual

`PLANEJAMENTO_ENTREGUE — AGUARDANDO VALIDAÇÃO DO CORTE E LIBERAÇÃO DA EXECUÇÃO`
