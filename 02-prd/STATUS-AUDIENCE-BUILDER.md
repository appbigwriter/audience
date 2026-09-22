# STATUS — Audience Builder

## Estado atual

`EXECUÇÃO_LOCAL_PARCIAL — MP-000 APROVADO; INTEGRAÇÕES E GATES EXTERNOS PENDENTES`

## Evidência independente mais recente

- `npx vitest run`: 27 arquivos / 287 testes PASS
- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS
- Review: `F:\Projetos\_FBR\FBR Blogs\08-historico\REVIEW-INDEPENDENTE-AUDIENCE-BUILDER-2026-09-22.md`
- Track A: handoff formal recebido, revisão local feita; integração externa pendente
- Track B: handoff formal recebido e revisado; superfície integrada local, sem persistência/browser/readback de produção

## Classificação por Sprint

| Sprint | Estado | Limite atual |
|---|---|---|
| S0 | validado localmente | Authority B1–B4 pendentes |
| S1 | validado e aprovado | Authority B1–B4 ainda pendentes |
| S2 | validado localmente | persistência/RLS/readback externos pendentes |
| S3 | parcialmente validado | editor visual/browser/persistência ainda não reproduzidos |
| S4 | parcialmente validado | calendário/SEO/mídia/QA independente pendentes |
| S5 | validado localmente com publicação bloqueada | nenhum contrato oficial/conta social |
| S6 | parcialmente validado | dashboard e métricas reais pendentes |
| S7 | validado localmente com integração pendente | sem readback Authority/Flux/Control Tower |
| S8 | piloto local parcial | QA visual, Gate e integração real pendentes |
| S9 | parcialmente validado localmente | operação contínua e segundo projeto pendentes |

## Blockers ativos

- API oficial do Authority para Persona aprovada, versão e hash;
- outbox assinado `persona.approved`;
- autenticação serviço-a-serviço definitiva;
- registro de derivados no Authority;
- migrations 001/002 não aplicadas;
- RLS/runtime de auth não verificados remotamente;
- review independente de Stories de UI e browser surface.

## Próximo Gate

1. Authority liberar contrato/readback real (B1–B4).
2. Definir e aprovar staging controlado, incluindo RLS/runtime auth.
3. Executar migrations somente com Gate e readback.
4. Integrar browser surface, persistência e smoke real.

O Audience Builder consumirá somente Personas validadas pelo Authority Engine. O Authority ainda está em fase de testes/validação. Enquanto o contrato real não estiver liberado, o desenvolvimento poderá usar fixtures explicitamente `test-only`, sem tratar fixture como integração de produção.

## Quadro mestre

| Sprint | Tema | Stories | Status | Dependência |
|---|---|---:|---|---|
| S0 | Authority Gate e contrato de entrada | 6 | pendente | testes/contrato do Authority |
| S1 | Análise da foundation e fundação própria | 6 | pendente | S0 readiness report |
| S2 | Audience Project, Persona Binding e Manifesto | 6 | pendente | S1 |
| S3 | Design System, Template Engine e programação visual | 7 | pendente | S2 |
| S4 | Editorial Engine, pesquisa, SEO e mídia | 9 | pendente | S2 |
| S5 | Descoberta de canais e Social Engine | 9 | pendente | S2 |
| S6 | Monetização, afiliados e analytics | 6 | pendente | S2; S4 |
| S7 | Flux, Control Tower e runtime | 7 | pendente | S2; contratos S1 |
| S8 | Piloto, E2E e QA independente | 8 | pendente | S3–S7 |
| S9 | Replicação e operação contínua | 7 | pendente | S8 |
| **Total** |  | **71** | **0 concluídas validadas** |  |

## Stories

A lista completa está em:

`F:\Projetos\_FBR\FBR Blogs\02-prd\SPRINTS-STORIES-AUDIENCE-BUILDER.md`

## Owners planejados

- **Agente A:** domínio, contratos, persistência, migrations locais, adapters e integrações.
- **Agente B:** produto, UI, design system, templates, editor visual, Social Engine e dashboards.
- **David/GPT-5.6-luna-900k:** revisão e correção ao final de cada Sprint.
- **Sergio:** Gates humanos, aprovação da fundação, publicação, gastos, secrets, produção e decisões fora do plano.

## Regras de execução registradas

- Dois agentes de implementação usando Z.ai/GLM 5.2, quando o provider estiver disponível e validado.
- Ownership de paths não sobreposto.
- Agentes avançam para Stories elegíveis sem espera silenciosa.
- Revisão independente ao final de cada Sprint.
- Critério funcional: **“Esse recurso corresponde exatamente ao que o sistema necessita?”**
- Checagem operacional a cada 30 minutos durante execução real.
- Reporte Telegram a cada 60 minutos, somente no formato:

```text
Planejamento segue - x% feito, x stories pending, x interrupcoes
```

- Percentual conta somente Stories `concluido_validado`.
- Monitoramento e Telegram não serão agendados silenciosamente durante o planejamento; devem ser configurados e validados no início da execução.

## Próximo Gate

1. Authority liberar contrato/readback real (B1–B4).
2. Definir e aprovar staging controlado, incluindo RLS/runtime auth.
3. Executar migrations somente com Gate e readback.
4. Integrar browser surface, persistência e smoke real.
5. Reexecutar review independente por Story/Sprint antes de promover qualquer Story a `concluido_validado`.
