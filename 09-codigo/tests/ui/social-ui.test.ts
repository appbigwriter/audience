/**
 * Track B — AB-S5-001..009: capability map, recomendação data-driven, planos, variantes, approval package e feedback.
 */
import { describe, expect, it } from 'vitest'
import {
  CHANNEL_CATALOG, CHANNEL_CATALOG_VERSION, channelPublishBlocker, findChannel, validateCatalogProvenance,
} from '../../packages/social-ui/src/capability-map'
import {
  compareChannelCombos, generateChannelHypotheses, RECOMMENDATION_MODEL_VERSION, type ProjectSignals,
} from '../../packages/social-ui/src/recommendation'
import {
  assembleSocialApprovalPackage, assertPublishBlocked, createChannelPlan, createChannelVariant, decideChannelPlan,
  type ContentOrigin,
} from '../../packages/social-ui/src/channel-plan'
import { applyFeedbackToRecommendation, ingestVerifiedMetrics, type ChannelMetric } from '../../packages/social-ui/src/feedback'

const project: ProjectSignals = {
  niche: 'culinária-e-utensílios',
  audienceSkew: 'mixed',
  primaryFormats: ['image', 'long-text', 'carousel'],
  visualDirection: 'documentary',
  cadenceCapacityPerWeek: 7,
  businessObjective: 'traffic',
  productionCapacity: { video: false, design: true, writing: true },
  complianceSensitivity: 'low',
}

describe('AB-S5-001/002 Capability map', () => {
  it('catálogo tem canais suficientes e versionado com provenance', () => {
    expect(CHANNEL_CATALOG.length).toBeGreaterThanOrEqual(8)
    expect(CHANNEL_CATALOG_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/)
    const prov = validateCatalogProvenance()
    expect(prov.ok).toBe(true)
  })

  it('cada canal registra formatos, limites, cadência, métricas, riscos e operação', () => {
    for (const c of CHANNEL_CATALOG) {
      expect(c.formats.length).toBeGreaterThan(0)
      expect(c.cadenceGuidance.healthyPerDay).toHaveLength(2)
      expect(c.metricsAvailable.length).toBeGreaterThan(0)
      expect(c.risks.length).toBeGreaterThan(0)
      expect(c.operational.requiresAccount).toBeDefined()
      expect(typeof c.operational.estimatedSetupEffortHours).toBe('number')
      expect(['free', 'low', 'medium', 'high']).toContain(c.operational.monetaryCostLevel)
    }
  })

  it('sem contrato oficial, publicação é bloqueio explícito', () => {
    const b = channelPublishBlocker('instagram')
    expect(b.blocked).toBe(true)
    expect(b.reason).toContain('sem contrato oficial')
    expect(findChannel('instagram')!.integration.status).not.toBe('official-contract')
    expect(channelPublishBlocker('canal-fantasma').blocked).toBe(true)
  })
})

describe('AB-S5-003/004 Hipóteses de canal (data-driven)', () => {
  it('gera candidatos ranqueados a partir de sinais, sem hardcode de canal', () => {
    const run = generateChannelHypotheses(project)
    expect(run.modelVersion).toBe(RECOMMENDATION_MODEL_VERSION)
    expect(run.candidates.length).toBe(CHANNEL_CATALOG.length)
    const scores = run.candidates.map(c => c.fitScore)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
    expect(run.candidates[0].rank).toBe(1)
    // data-driven: trocar sinais muda o ranking
    const videoProject: ProjectSignals = { ...project, productionCapacity: { video: true, design: true, writing: true }, primaryFormats: ['short-video', 'image'] }
    const videoRun = generateChannelHypotheses(videoProject)
    expect(videoRun.candidates[0].channelId).not.toBe(run.candidates[0].channelId)
  })

  it('toda recomendação explica sinais, incertezas e dados faltantes', () => {
    const run = generateChannelHypotheses(project)
    for (const c of run.candidates) {
      expect(c.signals.length).toBeGreaterThanOrEqual(7)
      expect(c.signals.every(s => s.note.length > 0)).toBe(true)
    }
    // sem contrato oficial → incerteza de integração registrada
    const ig = run.candidates.find(c => c.channelId === 'instagram')!
    expect(ig.uncertainties.some(u => u.kind === 'integration')).toBe(true)
    expect(ig.publishableNow).toBe(false)
    expect(ig.hardBlockers.length).toBeGreaterThan(0)
  })

  it('capacidade de vídeo ausente derruba canais de vídeo', () => {
    const run = generateChannelHypotheses(project)
    const video = run.candidates.find(c => c.channelId === 'tiktok')!
    const prod = video.signals.find(s => s.signal === 'productionFit')!
    expect(prod.raw).toBe(0)
    expect(video.missingData.some(m => m.kind === 'production')).toBe(true)
  })

  it('nicho sensível pontua compliance menor', () => {
    const run = generateChannelHypotheses(project)
    const normal = run.candidates.find(c => c.channelId === 'tiktok')!.signals.find(s => s.signal === 'complianceFit')!
    const sensitive = generateChannelHypotheses({ ...project, complianceSensitivity: 'high' }).candidates.find(c => c.channelId === 'tiktok')!.signals.find(s => s.signal === 'complianceFit')!
    expect(sensitive.raw).toBeLessThan(normal.raw)
  })
})

describe('AB-S5-005 Combinações de canais', () => {
  it('compara combos por esforço, custo, reuso, risco e bloqueios, com versão', () => {
    const combos = compareChannelCombos(project, [
      { channelIds: ['pinterest', 'x-twitter'] },
      { channelIds: ['instagram', 'tiktok', 'youtube-long'] },
      { channelIds: ['canal-inexistente'] },
    ], 'v1')
    expect(combos).toHaveLength(3)
    const light = combos[0]
    const heavy = combos[1]
    expect(light.totalEffortHoursPerWeek).toBeLessThan(heavy.totalEffortHoursPerWeek)
    expect(heavy.verdict).not.toBe('viable') // esforço excede capacidade do projeto
    expect(combos.every(c => c.versionTag === 'v1')).toBe(true)
    expect(combos[2].notes.join(' ')).toContain('desconhecidos')
    expect(light.reusePotential).toBeGreaterThanOrEqual(0)
    expect(['low', 'medium', 'high']).toContain(light.reachPotential)
  })
})

const origin: ContentOrigin = {
  originId: 'art-1', kind: 'article', title: 'Melhor faca de chef', url: '/guias/melhor-faca',
  keyPoints: ['desgaste', 'ergonomia'], disclosureRequired: true,
}

describe('AB-S5-006 Channel Plan', () => {
  const planBase = {
    planId: 'plan-1', projectId: 'ap-1', channelId: 'pinterest', objective: 'tráfego evergreen',
    formats: ['pin', 'image'], cadence: '5 pins/semana', ctaStrategy: 'ler guia completo', tone: 'prático',
    assetsRequired: ['pin-vertical'], metrics: ['saves', 'outbound-clicks'],
    derivedFrom: { recommendationRunId: 'run-1', fitScore: 72 },
  }

  it('cria plano candidato com aprovação obrigatória', () => {
    const p = createChannelPlan(planBase)
    expect(p.status).toBe('candidate')
    expect(p.approvalRequired).toBe(true)
  })

  it('formatos fora do canal rejeitados; canal inexistente rejeitado', () => {
    expect(() => createChannelPlan({ ...planBase, formats: ['long-video'] })).toThrow(/não suportados/)
    expect(() => createChannelPlan({ ...planBase, channelId: 'orc-ut' })).toThrow(/não existe/)
  })

  it('decisão aprova/rejeita/suspende com ator; rejeição exige motivo', () => {
    const p = createChannelPlan(planBase)
    expect(() => decideChannelPlan(p, 'reject', '')).toThrow()
    expect(() => decideChannelPlan(p, 'reject', 'sergio', '')).toThrow(/motivo/)
    const approved = decideChannelPlan(p, 'approve', 'sergio')
    expect(approved.status).toBe('approved')
    expect(approved.decidedBy).toBe('sergio')
  })
})

describe('AB-S5-007 Variantes por canal', () => {
  it('gera variante adaptada com disclosure quando origem tem afiliado', () => {
    const v = createChannelVariant({
      variantId: 'var-1', origin, channelId: 'pinterest', format: 'pin',
      text: 'Testamos 12 facas: a melhor custa menos que você imagina (afiliado). Veja o comparativo.',
      cta: 'Ler o guia',
    })
    expect(v.status).toBe('draft')
    expect(v.disclosure).toContain('afiliad')
    expect(v.charCount).toBe(v.text.length)
  })

  it('limite de caracteres do canal é respeitado', () => {
    expect(() => createChannelVariant({
      variantId: 'var-2', origin, channelId: 'x-twitter', format: 'short-text',
      text: 'x'.repeat(281), cta: 'Ler',
    })).toThrow(/excede/)
  })

  it('formato não suportado e CTA ausente rejeitam', () => {
    expect(() => createChannelVariant({ variantId: 'v', origin, channelId: 'pinterest', format: 'thread', text: 'ok afiliado', cta: 'x' })).toThrow()
    expect(() => createChannelVariant({ variantId: 'v', origin, channelId: 'pinterest', format: 'pin', text: 'ok afiliado', cta: '' })).toThrow(/CTA/)
  })

  it('origem com afiliado sem menção a disclosure na variante é rejeitada', () => {
    expect(() => createChannelVariant({
      variantId: 'v', origin, channelId: 'pinterest', format: 'pin',
      text: 'Testamos 12 facas e escolhemos a melhor.', cta: 'Ler',
    })).toThrow(/disclosure/)
  })
})

describe('AB-S5-008 Social approval package', () => {
  const variant = createChannelVariant({
    variantId: 'var-1', origin, channelId: 'pinterest', format: 'pin',
    text: 'Testamos 12 facas: a melhor custa menos (afiliado).', cta: 'Ler o guia',
  })

  it('pacote com variante não aprovada fica assembling com blockers', () => {
    const pkg = assembleSocialApprovalPackage({ packageId: 'pkg-1', projectId: 'ap-1', variants: [variant] })
    expect(pkg.status).toBe('assembling')
    expect(pkg.blockers.length).toBeGreaterThan(0)
    expect(pkg.blockers.join(' ')).toContain('não está aprovada')
  })

  it('mesmo com variante aprovada, pacote exige Gate humano e publicação permanece bloqueada', () => {
    const approvedVariant = { ...variant, status: 'approved-for-package' as const }
    const pkg = assembleSocialApprovalPackage({ packageId: 'pkg-2', projectId: 'ap-1', variants: [approvedVariant], sourceIds: ['s-1'], riskNotes: ['claim de preço'] })
    // Sem contrato oficial no catálogo, ready-for-gate é inalcançável por design: o blocker de contrato persiste.
    expect(pkg.blockers.some(b => b.includes('sem contrato oficial'))).toBe(true)
    expect(pkg.gate.required).toBe(true)
    expect(pkg.gate.gateOwner).toBe('sergio')
    expect(pkg.disclosurePresent).toBe(true)
    const pub = assertPublishBlocked(pkg)
    expect(pub.blocked).toBe(true)
    expect(pub.reason).toContain('Gate')
  })

  it('bloqueio de contrato entra como blocker do pacote', () => {
    const approvedVariant = { ...variant, status: 'approved-for-package' as const }
    const pkg = assembleSocialApprovalPackage({ packageId: 'pkg-3', projectId: 'ap-1', variants: [approvedVariant] })
    expect(pkg.blockers.some(b => b.includes('sem contrato oficial'))).toBe(true)
  })
})

describe('AB-S5-009 Feedback de desempenho', () => {
  const baseline = generateChannelHypotheses(project)

  const verified: ChannelMetric[] = [
    { channelId: 'pinterest', periodStart: '2026-09-01', periodEnd: '2026-09-15', metric: 'saves', value: 2400, provenance: 'verified-readback', readbackAt: '2026-09-16' },
    { channelId: 'tiktok', periodStart: '2026-09-01', periodEnd: '2026-09-15', metric: 'views', value: 20, provenance: 'reported' },
  ]

  it('só métricas verificadas alimentam aprendizado', () => {
    const { accepted, rejected } = ingestVerifiedMetrics(verified)
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(1)
  })

  it('aplicação gera fatos + hipóteses sem mutar o baseline', () => {
    const snapshot = JSON.stringify(baseline)
    const run = applyFeedbackToRecommendation(baseline, verified)
    expect(run.historyPreserved).toBe(true)
    expect(JSON.stringify(baseline)).toBe(snapshot)
    expect(run.learnings.some(l => l.kind === 'fact' && l.statement.includes('pinterest'))).toBe(true)
    expect(run.recommendationAdjustments.some(a => a.channelId === 'pinterest' && a.adjustment === 'increase-priority')).toBe(true)
    // métrica reportada (tiktok) não vira fato
    expect(run.learnings.some(l => l.statement.includes('tiktok'))).toBe(false)
  })

  it('sem métricas verificadas, não há ajustes', () => {
    const run = applyFeedbackToRecommendation(baseline, [])
    expect(run.learnings).toHaveLength(0)
    expect(run.recommendationAdjustments).toHaveLength(0)
  })
})
