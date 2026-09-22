/**
 * Track B — apps/audience-builder: S0/S1 readiness, gate de release, dashboards, wizard de descoberta.
 */
import { describe, expect, it } from 'vitest'
import {
  AUTHORITY_READINESS, CONVERGENCE_SURFACE, convergenceSummary, evaluateReleaseGate,
} from '../../apps/audience-builder/src/readiness'
import {
  buildDashboardCards, buildPortfolioReport, filterMetrics, type MetricDatapoint, type ProjectHealthRow,
} from '../../apps/audience-builder/src/dashboards'
import { buildAudienceBuilderSurface } from '../../apps/audience-builder/src/surface'
import { buildDiscoveryReport, initWizard, submitCombos, submitSignals, WIZARD_STEPS } from '../../apps/audience-builder/src/discovery-wizard'
import { findNichePreset } from '../../packages/design-system/src/presets'

describe('AB-S0-005 Readiness do Authority', () => {
  it('separa fatos, hipóteses e bloqueios com owner/nextAction/nextCheck', () => {
    expect(AUTHORITY_READINESS.facts.length).toBeGreaterThan(0)
    expect(AUTHORITY_READINESS.facts.every(f => f.evidence.length > 0)).toBe(true)
    for (const b of AUTHORITY_READINESS.blockers) {
      expect(b.owner).toBeTruthy()
      expect(b.nextAction).toBeTruthy()
      expect(b.nextCheck).toBeTruthy()
    }
    expect(AUTHORITY_READINESS.hypotheses.every(h => h.requires.length > 0)).toBe(true)
  })

  it('ausência de API oficial é bloqueio, não fixture mascarada', () => {
    expect(AUTHORITY_READINESS.blockers.some(b => b.cause.includes('API oficial'))).toBe(true)
  })
})

describe('AB-S0-006 Gate de liberação', () => {
  it('produção com fixture é bloqueada', () => {
    const gate = evaluateReleaseGate({
      authorityContractAvailable: false, personaPackageWithVersionAndHash: false,
      persistenceContractWithReadback: false, usingFixtureTestOnly: true, target: 'production',
    })
    expect(gate.decision).toBe('blocked')
    expect(gate.checks.find(c => c.id === 'G6')!.status).toBe('fail')
  })

  it('local com fixture vira development-only (não released)', () => {
    const gate = evaluateReleaseGate({
      authorityContractAvailable: false, personaPackageWithVersionAndHash: false,
      persistenceContractWithReadback: false, usingFixtureTestOnly: true, target: 'local',
    })
    expect(gate.decision).toBe('development-only')
  })

  it('todos os requisitos atendidos liberam com decisão do Sergio', () => {
    const gate = evaluateReleaseGate({
      authorityContractAvailable: true, personaPackageWithVersionAndHash: true,
      persistenceContractWithReadback: true, usingFixtureTestOnly: false, target: 'production',
    })
    expect(gate.decision).toBe('released')
    expect(gate.decidedBy).toBe('sergio')
    expect(gate.checks.every(c => c.status !== 'fail')).toBe(true)
  })
})

describe('S1 superfície de convergência', () => {
  it('matriz classifica itens e expõe gaps', () => {
    const summary = convergenceSummary()
    expect(summary.total).toBe(CONVERGENCE_SURFACE.length)
    expect(summary.byClass.adotar).toBeGreaterThan(3)
    expect(summary.byClass.substituir).toBeGreaterThan(2)
    expect(summary.gaps.length).toBeGreaterThan(0)
  })
})

const now = '2026-09-22T12:00:00.000Z'

const metrics: MetricDatapoint[] = [
  { metricId: 'm1', projectId: 'ap-1', contentId: 'art-1', metric: 'views', periodStart: '2026-09-01', periodEnd: '2026-09-15', value: 1200, origin: { kind: 'real-readback', readbackAt: '2026-09-16' } },
  { metricId: 'm2', projectId: 'ap-1', channelId: 'pinterest', metric: 'clicks', periodStart: '2026-09-01', periodEnd: '2026-09-15', value: 300, origin: { kind: 'estimate', source: 'heuristic' } },
  { metricId: 'm3', projectId: 'ap-2', metric: 'conversions', periodStart: '2026-09-01', periodEnd: '2026-09-15', value: 0, origin: { kind: 'missing' } },
  { metricId: 'm4', projectId: 'ap-1', metric: 'views', periodStart: '2026-08-01', periodEnd: '2026-08-15', value: 900, origin: { kind: 'real-readback', readbackAt: '2026-08-16' } },
]

describe('AB-S6-005/006 Dashboard de performance', () => {
  it('distingue real, estimativa, ausência e stale', () => {
    const cards = buildDashboardCards(metrics, now)
    const byId = Object.fromEntries(cards.map(c => [c.cardId, c]))
    expect(byId['card-m1'].dataQuality).toBe('real')
    expect(byId['card-m2'].dataQuality).toBe('estimate')
    expect(byId['card-m3'].dataQuality).toBe('missing')
    expect(byId['card-m3'].displayValue).toBe('—')
    expect(byId['card-m4'].dataQuality).toBe('stale')
  })

  it('filtros por projeto, canal, conteúdo e período funcionam', () => {
    expect(filterMetrics(metrics, { projectId: 'ap-1' }).map(m => m.metricId)).toEqual(['m1', 'm2', 'm4'])
    expect(filterMetrics(metrics, { channelId: 'pinterest' }).map(m => m.metricId)).toEqual(['m2'])
    expect(filterMetrics(metrics, { contentId: 'art-1' }).map(m => m.metricId)).toEqual(['m1'])
    expect(filterMetrics(metrics, { from: '2026-08-20' }).map(m => m.metricId)).toEqual(['m1', 'm2', 'm3'])
    expect(filterMetrics(metrics, { to: '2026-08-31' }).map(m => m.metricId)).toEqual(['m4'])
  })
})

const projects: ProjectHealthRow[] = [
  {
    projectId: 'ap-1', name: 'Piloto Utensílios', status: 'active',
    jobs: { total: 30, blocked: 2, done: 20 }, blockers: ['canal social sem contrato'],
    integrations: [{ name: 'authority', state: 'mock-local' }, { name: 'control-tower', state: 'pending' }],
    metricsAvailable: 3, lastAction: { what: 'draft editorial', at: '2026-09-21', actor: 'gestor-editorial' }, nextCheck: '2026-09-23',
  },
  {
    projectId: 'ap-2', name: 'Segundo Nicho', status: 'persona_bound',
    jobs: { total: 5, blocked: 0, done: 2 }, blockers: [],
    integrations: [{ name: 'authority', state: 'configured' }, { name: 'persona-fixture', state: 'mock-local' }],
    metricsAvailable: 0, lastAction: { what: 'binding', at: '2026-09-20', actor: 'agente-a' }, nextCheck: '2026-09-24',
  },
]

describe('AB-S9-003/005 Health e portfólio', () => {
  it('health dashboard mostra status, jobs, blockers, integrações e próximo check', () => {
    expect(projects[0].jobs.blocked).toBe(2)
    expect(projects[0].blockers[0]).toContain('sem contrato')
    expect(projects[0].integrations.every(i => ['mock-local', 'configured', 'verified', 'pending'].includes(i.state))).toBe(true)
    expect(projects.every(p => p.nextCheck >= '2026-09-22')).toBe(true)
  })

  it('relatório de portfólio separa buckets e nenhuma produção verificada sem readback', () => {
    const report = buildPortfolioReport(projects, now)
    expect(report.buckets.active).toEqual(['ap-1'])
    expect(report.buckets.blocked).toEqual(['ap-1'])
    expect(report.buckets.staging).toEqual(['ap-2'])
    expect(report.buckets.productionVerified).toEqual([])
    expect(report.note).toContain('readback')
  })
})

describe('Wizard de descoberta de canais', () => {
  const signals = {
    niche: 'culinária-e-utensílios', audienceSkew: 'mixed' as const,
    primaryFormats: ['image', 'long-text', 'carousel'] as never,
    visualDirection: 'documentary', cadenceCapacityPerWeek: 7,
    businessObjective: 'traffic' as const,
    productionCapacity: { video: false, design: true, writing: true },
    complianceSensitivity: 'low' as const,
  }

  it('fluxo signals → hypotheses → combos → report funciona sem decidir canal', () => {
    expect(WIZARD_STEPS).toHaveLength(4)
    let state = initWizard('ap-1')
    expect(state.step).toBe('signals')
    state = submitSignals(state, signals)
    expect(state.step).toBe('hypotheses')
    expect(state.run!.candidates.length).toBeGreaterThan(5)
    state = submitCombos(state, [{ channelIds: ['pinterest', 'x-twitter'] }, { channelIds: ['instagram'] }])
    expect(state.step).toBe('combos')
    expect(state.combos).toHaveLength(2)
    const report = buildDiscoveryReport(state, now)
    expect(report.decisionPending).toBe(true)
    expect(report.decisionOwner).toBe('sergio')
    expect(report.explicitlyNotDecided).toContain('Nenhum canal')
    expect(report.topCandidates.length).toBe(3)
    expect(report.bestViableCombo).toBeTruthy()
  })

  it('relatório sem hipóteses falha explicitamente', () => {
    expect(() => buildDiscoveryReport(initWizard('ap-1'), now)).toThrow(/hipóteses/)
    expect(() => submitCombos(initWizard('ap-1'), [{ channelIds: [] }])).toThrow(/sinais/)
  })

  it('combos inviáveis não viram bestViableCombo', () => {
    let state = submitSignals(initWizard('ap-1'), signals)
    state = submitCombos(state, [{ channelIds: ['instagram', 'tiktok', 'youtube-long', 'youtube-shorts'] }])
    const report = buildDiscoveryReport(state, now)
    expect(state.combos[0].verdict).not.toBe('viable')
    expect(report.bestViableCombo).toBeNull()
  })
})

describe('AB integrated local surface', () => {
  it('composes design, editorial, social, dashboard and health sections without auto-publish', () => {
    const signals = {
      niche: 'culinária', audienceSkew: 'mixed' as const,
      primaryFormats: ['image', 'long-text'] as never, visualDirection: 'documentary',
      cadenceCapacityPerWeek: 5, businessObjective: 'traffic' as const,
      productionCapacity: { video: false, design: true, writing: true }, complianceSensitivity: 'low' as const,
    }
    let wizard = submitSignals(initWizard('ap-1'), signals)
    wizard = submitCombos(wizard, [{ channelIds: ['pinterest'] }])
    const surface = buildAudienceBuilderSurface({
      projectId: 'ap-1', projectName: 'Piloto local',
      themeTokens: findNichePreset('niche-editorial-guia')!.tokens,
      pageContent: { siteName: 'Piloto', articles: [] }, calendar: [], wizard,
      health: [{ projectId: 'ap-1', name: 'Piloto local', status: 'planning', jobs: { total: 0, blocked: 0, done: 0 }, blockers: ['Authority pending'], integrations: [{ name: 'authority', state: 'mock-local' }], metricsAvailable: 0, lastAction: { what: 'wizard', at: '2026-09-22', actor: 'agent-b' }, nextCheck: '2026-09-23' }],
      metricsNow: '2026-09-22T12:00:00.000Z', generatedAt: '2026-09-22T12:00:00.000Z',
    })
    expect(surface.sections).toEqual(['design', 'editorial', 'social', 'dashboard', 'health'])
    expect(surface.html).toContain('Nenhum canal foi escolhido automaticamente')
    expect(surface.html).toContain('nenhuma publicação automática')
    expect(surface.previewHtml).toContain('role="main"')
  })
})
