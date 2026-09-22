# Projeto Conceitual — Audience Builder

## Status
`CONCEITUAL_EM_VALIDACAO`

Este documento define a visão, o posicionamento, os limites e a arquitetura conceitual do Audience Builder. Ele não aprova implementação, migration, deploy, publicação, gasto, criação de contas sociais ou alteração de contratos externos.

---

## 1. Resumo executivo

O **Audience Builder** será a plataforma da FBR Agency para transformar Personas aprovadas no Authority Engine em propriedades editoriais e presenças sociais coerentes, operáveis e monetizáveis.

O sistema não será apenas um gerador de sites, um CMS ou uma ferramenta de postagem automática. Ele será uma fábrica governada de audiência, formada por:

- Persona versionada;
- Projeto editorial;
- Blog temático;
- Identidade visual e sistema de templates;
- Pipeline de conteúdo;
- Adaptação para redes sociais;
- Monetização;
- Analytics;
- Aprovações e Gates;
- Operação durável coordenada pelo FBR Agency Flux.

A proposta central é permitir que uma única Persona gere uma ou mais propriedades editoriais sem perder coerência de voz, posicionamento, visual, regras de compliance ou rastreabilidade.

```text
Authority Engine
  Persona, Character Bible, Editorial Profile e Channel Plans
        |
        v
FBR Agency Flux
  Jobs, handoffs, dependências, gates, blockers e readbacks
        |
        +----------------------+
        |                      |
        v                      v
Control Tower              Audience Builder
Provisionamento            Blog, conteúdo, visual e social
        |                      |
        +----------+-----------+
                   v
        Métricas, monetização e aprendizado
```

---

## 2. O problema que o sistema resolve

Hoje, criar uma nova propriedade editorial exige repetir manualmente várias decisões:

- posicionamento;
- identidade visual;
- arquitetura do site;
- categorias;
- voz editorial;
- calendário;
- fontes;
- regras de conteúdo;
- perfis sociais;
- formatos por canal;
- links de afiliados e produtos;
- critérios de aprovação;
- infraestrutura e domínio.

Esse processo gera riscos:

- blogs visualmente genéricos;
- inconsistência entre persona, blog e redes sociais;
- cópia de conteúdo sem adaptação ao canal;
- agentes com responsabilidades sobrepostas;
- publicação sem Gate adequado;
- perda de origem e licença de imagens;
- configurações divergentes entre projetos;
- dificuldade de replicar um blog com segurança;
- confusão entre protótipo local e integração de produção.

O Audience Builder deve transformar esse trabalho em um processo configurável, versionado e verificável.

---

## 3. O que o Audience Builder é

O Audience Builder é uma **plataforma de criação e operação de propriedades de audiência orientadas por Personas**.

Uma propriedade de audiência pode incluir:

- um blog;
- newsletter;
- perfis sociais;
- canal de vídeo;
- biblioteca de recursos;
- páginas de produto;
- comunidade futura;
- campanhas de conteúdo;
- ativos de monetização.

A unidade principal não será o artigo nem o site isolado. Será o **Audience Project**, que conecta a Persona, a propriedade editorial, os canais, o calendário e os objetivos de negócio.

---

## 4. O que o Audience Builder não é

O sistema não deverá ser tratado como:

1. Um gerador de sites independentes sem governança;
2. Um clone de código para cada blog;
3. Um agente que publica diretamente sem aprovação;
4. Um substituto do Authority Engine;
5. Um substituto do FBR Agency Flux;
6. Um painel que acessa diretamente tabelas internas de outros sistemas;
7. Um editor visual totalmente livre na primeira versão;
8. Uma ferramenta que transforma qualquer afirmação gerada em fato;
9. Um sistema que usa imagem sem origem, licença ou metadados;
10. Um mecanismo que considera build local ou mock como integração de produção.

---

## 5. Princípios conceituais

### 5.1 Persona como fonte de identidade

O Authority Engine é a fonte canônica da Persona. O Audience Builder recebe uma versão aprovada e registra qual versão foi herdada.

O blog pode possuir ajustes operacionais próprios, mas não deve alterar silenciosamente:

- identidade;
- tese;
- promessa;
- valores;
- voz central;
- guardrails;
- claims permitidos;
- identidade física;
- diretrizes visuais;
- planos de canais.

### 5.2 Plataforma comum, configuração por projeto

Não criar um clone por blog. O sistema deverá manter:

```text
Código compartilhado
+ Manifesto do Audience Project
+ Persona versionada
+ Template versionado
+ Perfil editorial
+ Planos de canais
```

### 5.3 Draft por padrão

O sistema pode pesquisar, redigir, revisar, adaptar e preparar publicações, mas a saída padrão será `draft` ou `blocked`.

Publicação, resposta pública, gasto, ativação de anúncio e alterações irreversíveis exigem Gates definidos para o projeto.

### 5.4 Banco como fonte operacional

O estado operacional deverá ser persistido em banco relacional, com isolamento por projeto/tenant. JSON local pode existir como mock explícito de desenvolvimento, mas não deve ser tratado como fonte operacional de produção.

### 5.5 Evidência antes de conclusão

Toda transição importante deve carregar:

- ator;
- timestamp;
- versão do artefato;
- evidência;
- decisão;
- bloqueio, quando aplicável;
- próximo responsável;
- readback quando houver integração externa.

### 5.6 Visual alinhado ao propósito

A interface não será definida apenas por cores. Ela será derivada de:

- nicho;
- audiência;
- proposta editorial;
- personalidade;
- intenção de leitura;
- formato do conteúdo;
- monetização;
- acessibilidade;
- dispositivos prioritários.

---

## 6. Decisões aproveitadas dos documentos existentes

### 6.1 Decisões adotadas

As seguintes ideias dos documentos atuais permanecem como base:

- Authority Engine como fonte canônica da Persona;
- FBR Agency Flux como orquestrador durável;
- Control Tower como provisionador técnico governado;
- FBR Blogs como executor editorial;
- comunicação entre módulos por contratos oficiais, eventos, handoffs e readbacks;
- uma Persona podendo originar múltiplos blogs;
- gestor editorial validado antes do provisionamento;
- resultado editorial normal em `draft` ou `blocked`;
- três jobs editoriais diários na vertical inicial: dois de nicho e um baseado em oportunidade afiliada;
- pauta com pelo menos quatro pontos concretos;
- meta aproximada de 1.300 palavras quando aplicável;
- disclosure obrigatório para conteúdo afiliado;
- FBR Ads como módulo central reutilizável;
- formatos de anúncios limitados aos contratos já definidos: `1250x150` e `350x350`;
- Kora como dona do estado do Kanban;
- Sergio como Gate humano para publicação, gasto, comunicação pública e operações irreversíveis;
- estrutura de projeto numerada de `01-conceitual` a `09-codigo`;
- separação entre mock local, integração configurada e produção verificada;
- segredo mantido por referência segura, nunca em documentos compartilhados.

### 6.2 Ideias novas incorporadas

As seguintes ideias são incorporadas ao conceito do Audience Builder:

- manifesto versionado por Audience Project;
- sistema de templates em camadas;
- design tokens por nicho;
- componentes editoriais especializados;
- editor visual controlado por blocos;
- Social Engine separado do CMS;
- adaptação por canal, em vez de simples duplicação;
- biblioteca de ativos com origem, licença e alt text;
- Audience Project como unidade de produto acima do blog;
- reutilização de uma Persona em múltiplas propriedades;
- criação de uma fábrica replicável somente depois de validar um blog-piloto.

### 6.3 Ideias mantidas como hipótese ou fase posterior

Não serão consideradas decisões fechadas neste documento:

- publicação automática em redes sociais;
- criação automática de contas sociais;
- editor visual totalmente livre;
- geração automática de vídeos longos;
- comunidade própria;
- personalização por usuário em tempo real;
- otimização autônoma de verba;
- expansão simultânea para todas as redes;
- geração de múltiplos blogs em escala antes do piloto;
- criação de microserviços independentes para cada capacidade.

Esses itens dependem de briefing, contratos, capacidade operacional, segurança, custos e Gates próprios.

---

## 7. Modelo conceitual de domínio

### 7.1 Entidades principais

```text
Persona
  └── PersonaVersion
        └── AudienceProject
              ├── BlogInstance
              ├── SocialPresence[]
              ├── EditorialProfile
              ├── ThemeManifest
              ├── TemplateBinding
              ├── ChannelPlan[]
              ├── MonetizationProfile
              ├── ContentJob[]
              └── ApprovalPackage[]
```

### 7.2 Audience Project

O `AudienceProject` representa a propriedade de audiência como um todo.

Campos conceituais:

- `id`;
- `name`;
- `slug`;
- `owner_id`;
- `persona_id`;
- `persona_version_id`;
- `persona_content_hash`;
- `status`;
- `niche`;
- `audience_definition`;
- `business_objective`;
- `language`;
- `region`;
- `editorial_profile_id`;
- `theme_manifest_id`;
- `template_version`;
- `approval_policy`;
- `created_at`;
- `updated_at`.

### 7.3 Blog Instance

O `BlogInstance` representa a aplicação editorial derivada do Audience Project.

Deve conter:

- domínio;
- slug;
- schema/projeto de persistência;
- template;
- versão publicada;
- categorias;
- tags;
- menus;
- configurações SEO;
- políticas de comentário;
- referências de monetização;
- status de provisionamento;
- vínculo com Flux e Control Tower.

### 7.4 Social Presence

Representa a presença de um Audience Project em um canal.

Deve conter:

- canal;
- identificador externo, quando existir;
- perfil de voz;
- formatos aceitos;
- cadência;
- objetivos;
- regras de aprovação;
- status da integração;
- referência segura da credencial;
- último readback;
- métricas disponíveis.

---

## 8. Manifesto do Audience Project

O manifesto é o contrato configurável do projeto.

Exemplo conceitual:

```yaml
project:
  name: "Nome da Propriedade"
  slug: "nome-da-propriedade"
  niche: "nicho principal"
  language: "pt-BR"
  region: "BR"
  business_objective: "authority_and_monetization"

persona:
  id: "persona-id"
  version: 1
  content_hash: "hash-do-snapshot"

editorial:
  tone:
    - próximo
    - didático
    - confiável
  pillars:
    - pilar um
    - pilar dois
  forbidden_claims:
    - promessa sem fonte
  default_output: "draft"

blog:
  template: "editorial-reference"
  template_version: "1.0.0"
  categories:
    - guias
    - análises
    - ferramentas
  article_frequency: 2

visual:
  density: "comfortable"
  image_direction: "documentary"
  motion: "subtle"
  accessibility_level: "AA"

social:
  channels:
    - instagram
    - pinterest
  approval_required: true

monetization:
  affiliate_enabled: true
  product_ads_enabled: true
  newsletter_enabled: true
```

O manifesto deve ser versionado, validado por schema e associado a uma aprovação. Alterações críticas exigem nova versão.

---

## 9. Sistema de templates e programação visual

O sistema de templates será dividido em três camadas.

### 9.1 Design tokens

- cores;
- tipografia;
- escala tipográfica;
- espaçamento;
- grid;
- largura de leitura;
- sombras;
- bordas;
- raios;
- ícones;
- animações;
- estados de foco;
- contraste.

### 9.2 Template estrutural

Possíveis famílias:

- editorial/revista;
- guia de referência;
- blog de autoridade;
- reviews e comparativos;
- lifestyle;
- comunidade;
- produto e recomendações;
- notícias e atualizações.

### 9.3 Componentes orientados ao nicho

- comparador;
- checklist;
- calculadora;
- timeline;
- glossário;
- ficha técnica;
- box de especialista;
- FAQ;
- tabela;
- product card;
- newsletter;
- callout;
- quiz;
- mapa;
- receita ou procedimento.

### 9.4 Editor visual controlado

A primeira versão deverá trabalhar com blocos permitidos e variantes aprovadas:

```text
Canvas
 ├── Hero
 ├── Intro
 ├── Article Grid
 ├── Featured Guide
 ├── Comparison
 ├── Product Recommendation
 ├── Newsletter
 ├── FAQ
 └── Footer
```

O editor deve permitir reordenar blocos, trocar variantes, ajustar conteúdo e visualizar responsividade, mas não permitir alterações que quebrem o sistema de design ou o contrato editorial.

---

## 10. Pipeline operacional

```text
Persona approved
  → Audience Project intake
  → Manifest validation
  → Editorial manager validation
  → Control Tower provisioning
  → Blog binding
  → Social presence planning
  → Research
  → Briefing
  → Draft
  → Fact and source review
  → SEO review
  → Media review
  → Monetization review
  → Social adaptations
  → Approval package
  → Draft ready / Blocked / Published after Gate
  → Monitoring
  → Learning and iteration
```

Cada etapa deverá produzir artefatos verificáveis.

Exemplos:

- pesquisa: fontes, datas, termos e limitações;
- briefing: intenção, público, ângulo e quatro pontos mínimos;
- artigo: versão, contagem, fontes e claims;
- mídia: origem, licença, prompt, modelo, dimensões e alt text;
- social: variante por canal e CTA;
- aprovação: ator, decisão, motivo e versão aprovada;
- publicação: URL, timestamp, resposta do provider e readback.

---

## 11. Arquitetura de agentes

O Audience Builder deve usar agentes compartilhados com perfis específicos do projeto.

| Capacidade | Responsabilidade |
|---|---|
| Gestor Editorial | Voz, calendário, pauta e coordenação do blog |
| Research | Tendências, demanda, fontes e oportunidades |
| Writer/Copy | Artigos, hooks, títulos, CTAs e textos sociais |
| SEO | Intenção, estrutura, links, schema, indexação e performance |
| Visual | Direção de arte, imagens, assets e acessibilidade |
| Social | Adaptação, calendário e variações por canal |
| Monetização | Afiliados, produtos, anúncios e disclosure |
| QA/Gates | Fatos, claims, fontes, direitos, links e prontidão |
| Flux | Jobs, handoffs, bloqueios, dependências e estados |
| Kora | Kanban, capacidade e execução operacional |
| Second Brain Guardian | Decisões, fontes, evidências e histórico durável |

A Persona não deve ganhar um exército isolado de agentes. O sistema deve reutilizar capacidades e carregar o contexto correto por meio de manifesto, versão e skills do projeto.

---

## 12. Segurança, aprovação e limites

O Audience Builder deverá:

- bloquear publicação sem aprovação aplicável;
- bloquear gasto sem Gate;
- exigir disclosure de afiliado;
- registrar claims e fontes;
- rejeitar Persona não aprovada ou versão stale;
- impedir credenciais no frontend;
- manter secrets apenas por referência segura;
- exigir idempotência em provisionamento e eventos;
- separar staging de produção;
- registrar readback após mutações externas;
- manter rollback para alterações de template e publicação;
- impedir resposta pública automática em assuntos sensíveis.

---

## 13. Roadmap conceitual

### Fase 0 — Fundação e contratos

- fechar briefing;
- reconciliar Authority, Flux, Control Tower e Blogs;
- definir ownership;
- fechar eventos, APIs, idempotência e readbacks;
- produzir MP-000 atualizado;
- obter aprovação da fundação.

### Fase 1 — Blog-piloto

- uma Persona aprovada;
- um Audience Project;
- um blog;
- um template;
- fluxo editorial completo;
- conteúdo em draft;
- um canal social em modo controlado;
- analytics e auditoria.

### Fase 2 — Sistema de templates

- tokens;
- componentes;
- variantes;
- editor visual controlado;
- preview responsivo;
- versionamento;
- testes de regressão visual.

### Fase 3 — Social Engine

- variantes por canal;
- calendário;
- aprovação;
- publicação onde houver contrato oficial;
- métricas;
- reaproveitamento de conteúdo.

### Fase 4 — Replicação

- segundo nicho;
- segundo template;
- provisionamento repetível;
- comparação entre projetos;
- biblioteca de padrões;
- operação de múltiplos blogs.

### Fase 5 — Otimização

- feedback de audiência;
- melhorias de conversão;
- testes de títulos e layouts;
- recomendações de pauta;
- relatórios de portfólio;
- expansão controlada de canais.

---

## 14. Critérios conceituais de sucesso

O conceito será considerado consistente quando:

- uma Persona aprovada puder originar um Audience Project sem copiar código;
- o blog herdar versão e hash da Persona;
- o template puder ser trocado por configuração versionada;
- a identidade visual refletir nicho e proposta editorial;
- o conteúdo puder gerar variantes sociais sem simples duplicação;
- cada etapa possuir responsável, evidência e Gate;
- ads, afiliados e mídia tiverem rastreabilidade;
- publicação permanecer bloqueada até a aprovação correta;
- o projeto puder ser provisionado com readback;
- o estado operacional sobreviver a restart e não depender de JSON local;
- o piloto puder ser replicado depois sem criar divergência estrutural.

---

## 15. Questões em aberto

1. O Audience Project poderá conter mais de um blog desde a primeira versão ou isso ficará para a Fase 4?
2. Qual será o primeiro nicho-piloto?
3. Qual Persona do Authority será usada no piloto?
4. Qual canal social será validado primeiro?
5. O blog inicial usará domínio `fbr.news`, domínio próprio ou ambos?
6. O editor visual será desenvolvido antes ou depois do primeiro blog funcional?
7. Quais integrações sociais possuem contrato oficial disponível?
8. Quais métricas serão consideradas sucesso no primeiro ciclo?
9. Qual será o nível de autonomia aceitável para agendamento social?
10. O modelo inicial continuará com três jobs diários por blog ou será parametrizado por capacidade?
11. Quais componentes de nicho entram no primeiro template?
12. Qual será o Gate para liberar a primeira publicação pública?

---

## 16. Próximo passo recomendado

Não iniciar código novo a partir deste documento ainda.

A sequência recomendada é:

1. Sergio revisar o posicionamento do Audience Builder;
2. escolher a Persona e o nicho-piloto;
3. responder as questões estruturais abertas;
4. reconciliar este conceito com `MP-000-foundation.md` e `PRD-fbr-blogs.md`;
5. criar um novo MP-000 específico do Audience Builder ou atualizar o MP-000 existente, conforme a decisão de produto;
6. somente depois fatiar o projeto em PRDs, Stories e implementação.

## Decisão pendente

`Aguardando validação conceitual de Sergio.`
