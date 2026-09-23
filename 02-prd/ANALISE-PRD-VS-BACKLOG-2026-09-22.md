# Análise — PRD original × backlog de Sprints/Stories

**Card:** `AUTH-ANALISE-PRD-BACKLOG-20260922-001`  
**Data:** 2026-09-22  
**Escopo:** análise documental read-only; não houve execução de Story, alteração de código, migration, deploy, publicação, gasto ou integração externa.  
**Fontes primárias:**

- `02-prd/PRD-AUTHORITY-ENGINE-IMPLEMENTACAO.md` (PRD v0.1; status `draft`/planejamento; linhas 3–15 e 1850–1860);
- `02-prd/SPRINTS-TAREFAS-SUBTAREFAS-AUTHORITY-ENGINE.md` (backlog mestre S0–S10; estado planejado; linhas 1–22);
- `02-prd/stories/AUTHORITY-ENGINE-STORIES.md` (catálogo derivado com 46 Stories, todas `planned`; linhas 1–27);
- `02-prd/SPRINTS-STORIES-MVP-PARAMETROS-2026-09-22.md` (plano mais recente de 64 Stories; status `PLANEJAMENTO_PARA_DELIBERACAO`; linhas 1–36);
- `08-historico/AUDITORIA-PAGINA-POR-PAGINA-2026-09-22.md` (auditoria UI/API local; linhas 7–19, 427–521);
- `STATUS.md` (estado declarado e bloqueios; linhas 3–75);
- `08-historico/AUTHORITY-MVP-MONITORING.md` (monitoramento atual; linhas 8–14 e 158–172).

---

## 1. Conclusão executiva

### Fatos

1. O PRD original descreve um MVP completo de **28 telas/áreas**, três módulos (Radar, Seeds e Profile Building com Farmer → Post Machine), além de requisitos transversais de multi-tenancy, RBAC, RLS, evidência, Gates, auditoria, jobs, métricas e fail-closed.
2. O backlog mestre de S0–S10 é uma decomposição útil do PRD em **46 tarefas/Stories** (S0=3, S1=4, S2=3, S3=6, S4=5, S5=6, S6=5, S7=3, S8=4, S9=4, S10=3). O catálogo derivado confirma que as 46 estavam `planned`.
3. O documento mais recente de MVP converte a prioridade da auditoria em **64 Stories**, de S0 a S9, e preserva explicitamente como bloqueados os itens fora do MVP. O monitoramento registra **64 planned/pending, 0 promovidas e 0 Sprints completas verificavelmente**.
4. A auditoria página a página sustenta a percepção de que existe **shell visual e núcleo local parcial**, não o produto operacional especificado: APIs locais e fixtures coexistem; várias telas estão ausentes, usam DEMO/FAKE ou não consomem as APIs.
5. O próprio PRD ainda exige aprovação de Sergio antes de virar execução; o plano mais recente também exige deliberação explícita. Portanto, **a análise não libera programação**.

### Decisão de direção recomendada

Tomar o plano de **64 Stories como backlog operacional candidato**, pois ele incorpora as lacunas tela-a-tela e os quatro parâmetros de aceite. Porém, antes de iniciar qualquer Story, Sergio/David devem formalizar: (a) qual é o backlog canônico; (b) equivalência/migração dos 46 IDs para os 64 IDs; (c) Gate de entrada; e (d) owners e limites de cada fatia.

O backlog de 46 Stories não deve ser apagado: deve permanecer como **baseline de rastreabilidade PRD → decomposição original**. O plano de 64 deve se tornar seu sucessor controlado, não uma segunda fila concorrente.

---

## 2. Cobertura do PRD pelo backlog de 46 Stories

| Área do PRD | Cobertura no backlog S0–S10 | Avaliação documental |
|---|---|---|
| Fundação: tenant, RBAC, versionamento, auditoria, Gates, Evidence Ledger, fail-closed | S0, S1, S8, S9 | Coberta em alto nível; Gates/evidência aparecem, mas a matriz requisito→tela→API→tabela não é um artefato explícito. |
| Partner Registry, Source Registry e OpenAI Gateway | S2 | Cobertura funcional direta. Integrações reais ficam separadas em S10. |
| Opportunity Radar: Brief, Run, normalização, evidência, score e Dossier | S3 | Cobertura funcional direta, incluindo fake/manual/configurável. |
| Seeds: taxonomia, geração, diferenciação, score, comparison e decisão | S4 | Cobertura funcional direta, mas a decisão formal/handoff é condensada dentro de poucas Stories. |
| Farmer: Persona, Character Kit, visual, Marca/Blog, editorial, claims, monetização, Approval Pack | S5 | Cobertura funcional direta. |
| Post Machine: calendário, brief, draft, validação, revisão humana e bloqueio de publicação | S6 | Cobertura funcional direta. |
| Dashboard, pipeline, configurações, ajuda | S7 | Cobertura direta, embora a dependência seja mais rígida no catálogo do que no grafo macro. |
| Audit, métricas, feedback e observabilidade | S8 | Cobertura direta. |
| E2E fake, QA negativo, auditoria independente | S9 | Cobertura direta. |
| Integração real/marketplaces/publicação futura | S10 | **Fora do MVP no próprio PRD**; deve ser registro de Gate futuro, não sequência elegível para “conclusão do MVP”. |

**Leitura:** não encontrei uma capacidade central do PRD sem ao menos uma tarefa correspondente no backlog de 46. O problema principal é de **governança, granularidade de aceite e concorrência entre planos**, não de ausência absoluta de tópicos.

---

## 3. Por que o backlog de 46 não é suficiente como controlador de execução

### Fatos

1. O catálogo de 46 aplica praticamente os mesmos critérios genéricos a todas as Stories: “teste/contrato/prova”, falha fechada, receipt/handoff e separação local/fake/real. Isso é correto como DoD, mas não substitui aceites específicos por superfície e contrato.
2. O PRD possui 28 telas e exige estados de loading, vazio, erro recuperável/bloqueante, sem permissão, dados insuficientes, Gate, owner, job e readback. O backlog antigo agrupa várias telas e ações em Stories amplas — por exemplo, `S3-T06 Interface Radar`, `S5-T06 Claims, guardrails e Approval Pack` e `S7-T03 Configurações e governança`.
3. A auditoria demonstrou que a falha mais importante é justamente a desconexão entre UI, ação, API, persistência e readback. O plano de 64 Stories corrige essa lacuna ao fatiar cada jornada por tela/contrato/estado.
4. O backlog de 46 inclui S10 como Sprint de “integrações reais e publicação assistida futura”. Ainda que o texto imponha Gate, sua presença na cadeia de execução pode induzir interpretação de que integrações reais pertencem ao caminho normal do MVP. O PRD as coloca explicitamente fora do MVP.

### Hipótese (alta confiança)

O plano de 64 Stories é uma **reformulação de qualidade** do backlog de 46 para impedir que APIs isoladas, fixtures, build verde ou telas estáticas sejam confundidos com entrega do MVP. Ele está mais aderente à auditoria do produto atual.

---

## 4. Divergências e riscos que precisam ser resolvidos antes de codar

| ID | Achado | Classificação | Impacto | Decisão/ação necessária | Owner proposto |
|---|---|---|---|---|---|
| D-01 | Há dois backlogs ativos: 46 Stories S0–S10 e 64 Stories MVP-S0–MVP-S9. | Fato | Contagem, prioridade, receipts e status podem divergir. | Declarar um backlog canônico e anexar tabela de equivalência 46→64, incluindo itens removidos/divididos. | Sergio/David |
| D-02 | O PRD original está `draft` e afirma que não autoriza execução; o plano de 64 exige deliberação. | Fato | Nenhuma Story tem Gate de entrada comprovado por estes documentos. | Registrar aprovação/deliberação explícita ou manter HOLD. | Sergio |
| D-03 | O backlog de 46 coloca S10 (integrações reais/publicação futura) em sua cadeia, mas o PRD classifica tais ações como fora do MVP. | Fato | Risco de escopo e de mutação externa indevida. | Mover S10 para backlog pós-MVP/Gate futuro; não contar em aceite MVP. | David/Sergio |
| D-04 | O grafo macro antigo permite iniciar S7 com contratos S0/S1 e fixtures; a matriz resumida exige S1–S6; o catálogo derivado declara S7 dependente de S6. | Fato | Planejamento pode serializar excessivamente ou abrir UI contra contratos instáveis. | Definir quais Stories de UI podem iniciar por contrato estável e quais dependem de cada domínio. | David/arquitetura |
| D-05 | `STATUS.md` declara `LOCAL_IMPLEMENTATION_VERIFIED` e diferentes contagens históricas de testes; auditoria e monitoramento afirmam MVP não aceito, 0 Stories promovidas. | Fato | Risco de narrativa de progresso inconsistente. | Substituir resumo por matriz: baseline local verificado / Story pendente / blocker externo, com timestamp e fonte. | David/Kora |
| D-06 | Auditoria identifica muitas telas ausentes, demo/fake ou desconectadas de APIs existentes. | Fato | Construir mais shell sem fatia vertical repetirá a lacuna. | Executar jornadas verticais (UI→API→persistência/readback→Gate→teste), não “telas isoladas”. | Théo/dev + Gabe QA |
| D-07 | Owners nos backlogs são “prováveis” ou genéricos. | Fato | Não há responsabilidade atômica verificável. | Nomear owner único, reviewer independente e paths de ownership por Story antes de dispatch. | David/Kora |
| D-08 | Track B não possui `tsc`; não existe worker/heartbeat atribuível; plano de 64 permanece deliberation-gated. | Fato | Não há capacidade verificável para execução contínua nos tracks atuais. | Reparar ambiente somente após Gate e registrar receipt; não atribuir evidência de Track A ao B. | owner Track B / David |

---

## 5. Sequência de execução recomendada após Gate

A recomendação não é “implementar todas as páginas”. É fechar quatro fatias verticais que preservam o pipeline do PRD:

1. **S0 — baseline governado:** matriz requisito→resultado→tela→API→tabela, estados, escopo fora do MVP e harness fake.
2. **S1–S4 — Audience Radar:** login/tenant mínimo necessário → Partner/Source → Research Brief → Run → Evidence → Opportunity Dossier. Só liberar `qualified` com evidência e readback.
3. **S5–S6 — Seeds e Farmer:** Dossier qualificado → geração OpenAI versionada → Comparison Pack → decisão humana → Persona/Marca/Blog/Approval Pack.
4. **S7–S8 — Post Machine e controle:** calendário → briefing → draft → revisão humana → jobs/Gates/audit/métricas/feedback.
5. **S9 — prova de produto:** suíte por Story, E2E fake, restart/readback e receipt. Runtime autorizado é Gate separado; publicação e integrações reais continuam fora do MVP.

**Critério de liberação de uma Story:** interface e ação aplicáveis, contrato/API, persistência/readback, tenant/owner/RBAC/RLS, estados obrigatórios, teste reproduzível, receipt/handoff e Gate correspondente. Não aceitar build, fixture, endpoint isolado ou auto-relato como conclusão.

---

## 6. Gate de entrada proposto para iniciar a primeira Story

Permitir apenas `MVP-S0-001` após todos os itens abaixo:

- [ ] Sergio registra a deliberação de execução e define se o plano de 64 Stories substitui o catálogo de 46.
- [ ] David cria a tabela de equivalência `S0-T.. / S1-T..` ↔ `MVP-S..-...`, com destino de cada item de S10.
- [ ] Kora cria cards com ID canônico, owner, reviewer, dependências, paths de ownership, aceite e evidência.
- [ ] Nenhuma Story chama provider real, altera runtime, aplica migration, publica, cria conta ou gasta verba sem Gate próprio.
- [ ] Ambiente do track que será usado tem dependências verificadas; qualquer falha, inclusive `tsc` ausente, fica como blocker com receipt.

---

## 7. Handoff

```yaml
de: "Íris"
para: "Sergio / David / Kora"
card: "AUTH-ANALISE-PRD-BACKLOG-20260922-001"
objetivo do job: "Reconciliar o PRD original com os backlogs existentes antes de qualquer nova execução."
entregável: "F:\\Projetos\\_FBR\\AuthorityEngine\\08-historico\\ANALISE-PRD-VS-BACKLOG-2026-09-22.md — v1.0"
decisões/suposições:
  - "Fato: o catálogo antigo tem 46 Stories planejadas; o plano MVP mais recente possui 64 Stories planned/pending e 0 promovidas."
  - "Fato: PRD e plano MVP exigem decisão humana antes da execução."
  - "Hipótese alta: as 64 Stories são o sucessor mais adequado para controlar a implementação, desde que haja equivalência auditável com as 46."
pendências/blockers:
  - "D-01: backlog canônico não definido; owner Sergio/David."
  - "D-02: Gate humano de execução não evidenciado; owner Sergio."
  - "D-08: Track B sem tsc e sem worker atribuível; owner Track B/David."
gate: "entrada"
critérios de aceite/evidência:
  - "Análise separa fatos, hipóteses, decisões e blockers: este artefato, seções 1–6."
  - "Cobertura PRD→backlog e divergências de execução são rastreáveis às fontes listadas no topo."
  - "Nenhuma Story, Sprint, integração ou publicação foi promovida por esta análise."
```
