# Auditoria independente — FBR Blogs

- **Projeto:** `F:\Projetos\_FBR\FBR Blogs`
- **Data:** 2026-09-18
- **Base:** `GLOBAL-FLOW-AUTHORITY-BLOGS-FLUX-CONTROL-TOWER.md`
- **Auditoria revisada:** texto fornecido pelo usuário
- **Status:** auditoria concluída; integração transversal ainda bloqueada

## 1. Evidência executada

No diretório `09-codigo`:

```text
npm test       → 8 arquivos / 30 testes aprovados
npm run typecheck → aprovado
npm run lint   → aprovado, 0 warnings/errors
npm run build  → aprovado; Next.js standalone configurado
```

Rotas incluídas no build:

```text
/api/blogs
/api/blogs/[slug]
/api/editorial/daily-run
/api/integrations/flux/blog-provisioning
```

`git diff --check` do repositório passou na verificação anterior. A suíte gera `.data/` local durante alguns testes; esse artefato deve permanecer fora do commit.

## 2. Confirmado

### Contrato local Authority → Flux → Blogs

Confirmado no código/testes:

- endpoint autenticado `/api/integrations/flux/blog-provisioning`;
- ausência de token retorna `401`;
- Persona não aprovada retorna `422`;
- versão aprovada divergente retorna `422`;
- hash divergente retorna `422`;
- idempotência local por evento/chave;
- receipt metadata-only;
- snapshot não aparece no receipt;
- contrato v1 documentado em `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`;
- 30 testes locais aprovados.

### Build standalone

Confirmado em arquivo:

```js
output: 'standalone'
```

O `Dockerfile` copia `.next/standalone` e `.next/static` e inicia `server.js`. Isso confirma configuração e build local, mas não confirma uma imagem Docker construída/executada nem deploy no Easypanel.

### Segurança de secrets

Confirmado no escopo local:

- não há valores de secrets no contrato, fixtures ou receipts;
- o endpoint exige referência/configuração de token em runtime;
- o readback é sanitizado.

Isso não confirma assinatura criptográfica serviço-a-serviço definitiva.

## 3. Classificações corrigidas

### 3.1 “100% implementado e validado”

**Classificação corrigida: NÃO CONFIRMADO / EXCESSIVO.**

O que existe é uma implementação local de contrato e binding. A implementação de produção ainda não está completa porque:

1. `SupabaseRepository` não implementa persistência de `blog_persona_bindings`.
2. `SupabaseRepository` não implementa persistência de `editorial_profiles`.
3. `SupabaseRepository` não implementa `integration_inbox_events`.
4. `blog_persona_bindings`, `editorial_profiles` e `integration_inbox_events` aparecem em `schema.sql` como contrato local, não como migration aplicada.
5. O fluxo de binding usa `JsonRepository` local quando está em `local/development`.
6. Não existe readback remoto do binding/editorial config verificado.

### 3.2 “Pronto para receber payloads em staging”

**Classificação corrigida: NÃO CONFIRMADO.**

O endpoint local está pronto para teste controlado com fake/local runtime. Não há evidência de:

- identidade serviço-a-serviço assinada em staging;
- token configurado no runtime de staging;
- API do Authority disponível para read model;
- adapter real do Flux chamando o Blog;
- persistência Supabase das novas entidades;
- readback de staging;
- domínio/DNS/health do blog derivados.

O termo correto é:

```text
pronto para teste local de contrato;
staging pendente de configuração, deploy, persistência e readback.
```

### 3.3 Idempotência

**Classificação corrigida: CONFIRMADA LOCALMENTE; NÃO CONFIRMADA EM PRODUÇÃO.**

A idempotência foi demonstrada em `MockRepository`/`JsonRepository`. Porém, o caminho `SupabaseRepository` não possui os métodos de binding/editorial necessários, portanto não existe prova de idempotência no banco remoto.

### 3.4 Persistência de Inbox

**Classificação corrigida: DEFINIDA NO SQL; NÃO IMPLEMENTADA NO RUNTIME DO BLOG.**

A tabela conceitual `integration_inbox_events` existe no `schema.sql`, mas o repository do Blog não possui métodos de leitura/escrita dessa entidade. O inbox efetivo está no Flux, não no FBR Blogs.

### 3.5 Máquina de DNS

**Classificação: PENDENTE.**

O Blog ainda trata `domain` como string opcional. Não há no schema nem no domínio do Blog estados persistidos:

```text
domain_generated
awaiting_dns
dns_manual_confirmed
dns_verified
```

Também não há endpoint de readback de DNS pertencente ao FBR Blogs.

### 3.6 UI manual

**Classificação: GAP DE PRODUTO, NÃO FALHA DO CONTRATO LOCAL.**

A página `/` continua oferecendo criação manual por nome, slug e nicho. Isso é aceitável como sandbox/local, mas não deve ser tratado como fluxo de produção integrado. Falta separar visualmente:

- modo sandbox/manual;
- blogs derivados de Persona;
- estado de aprovação;
- estado de provisionamento;
- blockers/readbacks do Flux.

## 4. Veredito por camada

| Camada | Veredito correto | Evidência |
|---|---|---|
| Contrato local | **APROVADO LOCALMENTE** | 30 testes, typecheck, lint e build |
| Validação de Persona | **APROVADA LOCALMENTE** | testes de status, hash, versão e aprovação |
| Idempotência | **APROVADA LOCALMENTE** | Mock/JSON repository |
| Secrets | **APROVADA NO ESCOPO LOCAL** | receipts/fixtures sem valores |
| Supabase production persistence | **PENDENTE** | métodos ausentes no SupabaseRepository |
| DNS lifecycle | **PENDENTE** | string de domínio sem máquina de estados |
| Flux adapter real | **PENDENTE/BLOQUEADO** | adapter externo e readback não verificados |
| Control Tower reconciliation | **PENDENTE/BLOQUEADO** | migrations/readback remoto pendentes |
| Docker standalone | **CONFIGURADO, NÃO EXECUTADO** | next.config/Dockerfile; sem `docker build/run` verificado |
| Staging E2E | **NÃO CONFIRMADO** | não há deploy/readback staging |
| Produção | **BLOQUEADA** | Gates e readbacks externos ausentes |

## 5. Ajustes necessários antes de declarar E2E

1. Implementar métodos Supabase para `blog_persona_bindings` e `editorial_profiles`.
2. Definir se o inbox é exclusivamente do Flux ou se o Blog terá uma tabela de recebimento; não duplicar ownership sem necessidade.
3. Criar migration versionada separada para as entidades do Blog, sem aplicar remotamente.
4. Implementar estados de domínio/DNS e eventos de transição.
5. Implementar adapter real Flux → Blogs apenas após o contrato assinado.
6. Criar fake E2E conectado Authority read model → Flux inbox → Blogs binding → readback.
7. Executar `docker build` e `docker run` localmente, se a entrega exigir validação da imagem.
8. Fazer deploy/staging e readback somente após Gate de Sergio.
9. Atualizar `STATUS.md` para não chamar o sistema de pronto para staging/produção.
10. Atualizar a tasklist com os blockers e owners.

## 6. Veredito final

O FBR Blogs está:

```text
IMPLEMENTADO E VERIFICADO: contrato local v1, binding, validações e receipt sanitizado.

NÃO CONFIRMADO: staging, Docker executado, Supabase remoto, adapter real e readbacks.

PENDENTE: DNS lifecycle, persistência relacional das novas entidades e E2E conectado.

BLOQUEADO: produção, publicação e qualquer Gate de integração externa.
```

A auditoria fornecida é válida como descrição do **slice local**, mas deve ser corrigida antes de circular como declaração de prontidão transversal.
