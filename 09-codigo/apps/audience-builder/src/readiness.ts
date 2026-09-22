/**
 * Track B — S0/S1 readiness surfaces (UI).
 * AB-S0-005 (readiness do Authority, exibição), AB-S0-006 (Gate checklist de liberação) e
 * superfície de convergência S1 (AB-S1-001/002 em forma de dashboard consumível).
 * FATOS vs HIPÓTESES vs BLOQUEIOS são separados por tipo — a UI não mascara fixture como integração.
 */
export const READINESS_UI_VERSION = 1

export type ReadinessFact = { id: string; statement: string; evidence: string }
export type ReadinessHypothesis = { id: string; statement: string; requires: string }
export type ReadinessBlocker = { id: string; cause: string; owner: string; nextAction: string; nextCheck: string }

export type AuthorityReadiness = {
  checkedAt: string
  facts: ReadinessFact[]
  hypotheses: ReadinessHypothesis[]
  blockers: ReadinessBlocker[]
}

/**
 * Estado verificável em 2026-09-22 (fonte: STATUS-AUDIENCE-BUILDER.md + monitor receipt 2026-09-22-001).
 * Dados factuais citam o arquivo; bloqueios têm owner/nextAction/nextCheck.
 */
export const AUTHORITY_READINESS: AuthorityReadiness = {
  checkedAt: '2026-09-22',
  facts: [
    { id: 'F1', statement: 'STATUS-AUDIENCE-BUILDER.md registra o Authority em fase de testes/validação; o contrato real não está liberado', evidence: '02-prd/STATUS-AUDIENCE-BUILDER.md (Dependência crítica)' },
    { id: 'F2', statement: 'Fixtures explicitamente test-only são permitidas para desenvolvimento local', evidence: 'STATUS-AUDIENCE-BUILDER.md; decisão 7 da tasklist' },
    { id: 'F3', statement: 'Adapter-contract v1 de persona binding já existe no código legado (validateAuthorityPersonaBinding)', evidence: '09-codigo/lib/persona-binding.ts' },
    { id: 'F4', statement: 'Baseline de testes local verde (30 testes/8 arquivos no início do dispatch; suite expandida desde então)', evidence: 'Vitest run 2026-09-22 00:11' },
  ],
  hypotheses: [
    { id: 'H1', statement: 'O Authority publicará pacote de Persona com versão+hash antes do piloto E2E', requires: 'confirmação do time Authority' },
    { id: 'H2', statement: 'O formato do snapshot seguirá o contrato v1 existente com extensões', requires: 'contrato oficial consumível' },
  ],
  blockers: [
    { id: 'B1', cause: 'API oficial do Authority não disponível para consumo', owner: 'Agente A (contratos/adapters)', nextAction: 'consumir contrato oficial quando liberado; substituir fixture por integração com readback', nextCheck: 'fim do Sprint S0 do Authority' },
    { id: 'B2', cause: 'Nenhum canal social possui contrato oficial FBR', owner: 'Sergio/coordenador', nextAction: 'decisão de canal-piloto após recomendação data-driven (S5)', nextCheck: 'revisão do Sprint S5' },
  ],
}

export type GateCheckStatus = 'pass' | 'fail' | 'warn'

export type GateCheck = { id: string; requirement: string; status: GateCheckStatus; detail: string }

export type ReleaseGate = {
  gateId: string
  purpose: string
  checks: GateCheck[]
  decision: 'released' | 'blocked' | 'development-only'
  decidedBy?: string
}

/** AB-S0-006: checklist que libera/bloqueia a criação de Audience Projects por ambiente. */
export function evaluateReleaseGate(params: {
  authorityContractAvailable: boolean
  personaPackageWithVersionAndHash: boolean
  persistenceContractWithReadback: boolean
  usingFixtureTestOnly: boolean
  target: 'local' | 'production'
}): ReleaseGate {
  const checks: GateCheck[] = [
    { id: 'G1', requirement: 'Persona aprovada pelo Authority', status: params.personaPackageWithVersionAndHash ? 'pass' : 'fail', detail: params.personaPackageWithVersionAndHash ? 'pacote com versão+hash disponível' : 'sem pacote aprovado — fixture test-only apenas' },
    { id: 'G2', requirement: 'Pacote versionado com content_hash', status: params.personaPackageWithVersionAndHash ? 'pass' : 'fail', detail: 'versão e hash são obrigatórios no binding' },
    { id: 'G3', requirement: 'Contrato de persistência com readback', status: params.persistenceContractWithReadback ? 'pass' : 'warn', detail: params.persistenceContractWithReadback ? 'persistência relacional com readback definida' : 'persistência pendente (Agente A) — UI não persiste por conta própria' },
    { id: 'G4', requirement: 'Contrato oficial do Authority', status: params.authorityContractAvailable ? 'pass' : 'fail', detail: params.authorityContractAvailable ? 'contrato consumível' : 'bloqueio B1: API oficial indisponível' },
    { id: 'G5', requirement: 'Fixture explicitamente marcada test-only (dev local)', status: params.usingFixtureTestOnly ? 'warn' : 'pass', detail: params.usingFixtureTestOnly ? 'fixture permitida somente em local/staging' : 'nenhuma fixture usada' },    { id: 'G6', requirement: 'Produção não pode usar fixture', status: params.target === 'production' && params.usingFixtureTestOnly ? 'fail' : 'pass', detail: 'produção exige Persona real aprovada' },
  ]

  const hardFail = checks.some(c => c.status === 'fail')
  const decision: ReleaseGate['decision'] = hardFail
    ? (params.target === 'local' ? 'development-only' : 'blocked')
    : 'released'
  return {
    gateId: 'ab-release-gate-v1',
    purpose: 'Liberar ou bloquear a criação de Audience Projects por ambiente',
    checks,
    decision,
    decidedBy: decision === 'released' ? 'sergio' : undefined,
  }
}

/** S1 — superfície de convergência: classificação da foundation legada (consumo da matriz do Agente A). */
export type ConvergenceRow = {
  item: string
  category: 'stack' | 'arquitetura' | 'schema' | 'adapters' | 'agentes' | 'gates' | 'riscos'
  classification: 'adotar' | 'adaptar' | 'substituir' | 'legado' | 'aberto'
  note: string
}

export const CONVERGENCE_SURFACE: ConvergenceRow[] = [
  { item: 'Next.js + TypeScript em 09-codigo', category: 'stack', classification: 'adotar', note: 'mesma stack para packages e apps do Audience Builder' },
  { item: 'Vitest como runner de testes', category: 'stack', classification: 'adotar', note: 'tests/ui e tests/visual herdam o runner existente' },
  { item: 'Domínio puro + repository mock (lib/)', category: 'arquitetura', classification: 'adaptar', note: 'Agente A extrai contratos; UI consome tipos compartilhados' },
  { item: 'Schema blog_config/editorial_jobs (04-database)', category: 'schema', classification: 'adaptar', note: 'estende para audience_project/binding/manifesto (Agente A)' },
  { item: 'persona-binding.ts adapter-contract v1', category: 'adapters', classification: 'adotar', note: 'contrato v1 já valida approved+hash; UI herda regras' },
  { item: 'Agents Íris/Kora/Théo/Gabe', category: 'agentes', classification: 'adotar', note: 'perfis compartilhados por manifesto, não exército por blog' },
  { item: 'Gates: Sergio aprova publicação/gasto', category: 'gates', classification: 'adotar', note: 'approval package social exige Gate sergio por design' },
  { item: 'JSON operacional como fonte de estado', category: 'riscos', classification: 'substituir', note: 'banco relacional é fonte operacional; UI não cria persistência paralela' },
  { item: 'Editor visual totalmente livre', category: 'riscos', classification: 'substituir', note: 'v1 é controlado por blocos aprovados (AB-S3-006)' },
  { item: 'Template único fixo por blog', category: 'arquitetura', classification: 'substituir', note: 'template registry versionado por projeto (AB-S3-003)' },
  { item: 'Canal social fixo no snapshot', category: 'adapters', classification: 'substituir', note: 'descoberta data-driven substitui canal hardcode (S5)' },
  { item: 'Domínio fbr.news vs próprio', category: 'stack', classification: 'aberto', note: 'questão 5 do conceitual — decisão de Sergio' },
]

export function convergenceSummary(rows: ConvergenceRow[] = CONVERGENCE_SURFACE) {
  const byClass = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.classification] = (acc[r.classification] ?? 0) + 1
    return acc
  }, {})
  return { total: rows.length, byClass, gaps: rows.filter(r => r.classification === 'aberto').map(r => r.item) }
}
