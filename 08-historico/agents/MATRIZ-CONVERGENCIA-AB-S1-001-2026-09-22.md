# Matriz de Convergência — Audience Builder × MP-000 FBR Blogs

- **Task:** FBR-BLOGS-PLAN-20260921-002 (Agente A — backend track)
- **Story:** AB-S1-001
- **Data:** 2026-09-22
- **Fontes:** `MP-000-foundation.md`, `02-prd/PROJETO-CONCEITUAL-AUDIENCE-BUILDER.md`, `03-arquitetura/authority-blogs-flux-contract.md`, código em `09-codigo/`
- **Classificações:** `adotar` | `adaptar` | `substituir` | `manter_legado` | `aberto`

> Nenhum item foi marcado como adotado apenas por existir. Cada linha cita a decisão do foundation e a razão da classificação no contexto do Audience Builder.

| # | Decisão do foundation (MP-000) | Classificação AB | Razão / condição no Audience Builder |
|---|---|---|---|
| 1 | Next.js + TypeScript em `09-codigo` | **adaptar** | Monorepo `packages/` (domain, contracts, persistence, adapters) passa a governar; app Next.js legada vira consumidora dos contratos, não a estrutura final |
| 2 | Domínio puro com repositório mock seguro | **adotar** | Padrão mantido e estendido em `packages/domain` + `packages/persistence` (InMemory com readback verificável) |
| 3 | Adapters para Hermes, Control Tower, FBR Ads, imagens | **adaptar** | Adapters existentes permanecem; AB adiciona adapter Authority (intake) sob contrato `persona-intake.v1`; imagem/AI provider continua `aberto` |
| 4 | Produção futura Postgres/Supabase via GestaoDB | **adotar** | Migrações versionadas em `09-codigo/migrations/`; aplicação remota exige Gate |
| 5 | Íris recebe/roteia intake; Kora autoridade Kanban | **adaptar** | Papéis mantidos, mas intake do AB é contrato estruturado (PersonaIntakePackage), não formulário solto |
| 6 | Gestor Editorial validado antes do Control Tower | **adotar** | Pré-condição preservada; no AB a validação depende de manifesto + binding ativos |
| 7 | Théo acompanha provisionamento; Gabe QA | **adotar** | Inalterado no AB |
| 8 | Sergio aprova publicação/gasto/ação destrutiva | **adotar** | Reforçado: gate de release codifica `production` exigindo integração autorizada + sem fixture |
| 9 | Schema `blog_config`…`seo_reviews` (DDL em `04-database/schema.sql`) | **substituir** | Tabelas do AB (`audience_*`) são novas com ownership próprio; tabelas legadas permanecem para a vertical original (`manter_legado` dentro do schema legado) |
| 10 | Repository JSON local como fonte operacional | **substituir** | JSON é apenas dev; operacional é relacional (migration 001) com tenant scope obrigatório |
| 11 | "O mock não simula credenciais nem contratos externos" | **adotar** | Princípio levado ao contrato: `meta.testOnly` obrigatório; fixture nunca habilita produção |
| 12 | Três jobs editoriais diários (2 nicho + 1 oportunidade afiliada) | **manter_legado** | Vertical legada mantém; AB parametriza frequência no manifesto (`articleFrequencyPerWeek`), decisão de cadência é do projeto |
| 13 | ~1.300 palavras quando aplicável | **manter_legado** | Referência da vertical; AB não fixa contagem no contrato de domínio |
| 14 | Formatos de anúncios `1250x150` e `350x350` | **adotar** | Contratos FBR Ads existentes seguem válidos para inventário do AB |
| 15 | Disclosure obrigatório para afiliado | **adotar** | Estendido: `disclosurePolicy` no snapshot + validação de pacote exige templates |
| 16 | FBR Ads como módulo central reutilizável | **adotar** | Sem duplicação; AB referencia, não re-implementa |
| 17 | Estrutura `01-conceitual`…`09-codigo` | **adotar** | Árvore documentada em AB-S1-004 |
| 18 | Segredo por referência segura | **adotar** | Sem mudança; pacote de configuração carrega somente referências |
| 19| "Todo conteúdo termina em `draft` ou `blocked`" | **adotar** | Codificado: `editorial.defaultOutput ∈ {draft, blocked}` no manifesto |
| 20 | Provider de imagens, sincronização Kora, banco VPS "a confirmar" | **aberto** | Continuam em aberto; herdados como riscos do MP-000 |

## Gaps identificados (não cobertos pelo foundation)

| Gap | Impacto no AB | Status |
|---|---|---|
| Entidade `AudienceProject` não existe | Núcleo do produto | **implementado** (`packages/domain/audience-project.ts`) |
| Persona binding versionado não existia como contrato próprio do AB | Intake/segurança | **implementado** (`packages/contracts/persona-intake.ts`) |
| Social/Channel discovery sem modelo | Sprint S5 | **pendente** (backend: capability map + adequação são Stories S5) |
| Template/design system sem versionamento por projeto | Sprint S3 (Agente B parcial; contratos S3 com A) | **pendente** |
| Manifesto versionado por projeto | Contrato central | **implementado** (`packages/domain/manifesto.ts`) |
| Monetização/analytics sem eventos versionados | Sprint S6 | **pendente** |
| Outbox/inbox idempotente transversal | Sprint S7 | **pendente** |

## Decisões incompatíveis explicitadas

1. **JSON como fonte operacional** (foundation) é incompatível com o princípio 5.4 do conceito AB — substituído por relacional + fixtures test-only.
2. **Blog como unidade principal** (foundation) cede lugar ao **Audience Project** como unidade de produto; blog vira derivado.
3. **Intake por formulário name/slug/niche** substituído por pacote versionado com hash — formulário permanece apenas na vertical legada.

## Pendências para revisão independente

- Classificações `aberto` (linha 20) precisam de decisão de produto.
- RLS completo (policy por tenant) depende do runtime de auth do Flux — gate técnico futuro.
