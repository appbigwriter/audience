/**
 * SPRINT S5 backend — capability map, sinais, hipóteses, combinações.
 */
import { describe, expect, it } from 'vitest'
import { compareCombinations, generateChannelHypotheses, scoreChannelFit, validateChannelCapability, type ChannelCapability } from '../../packages/domain/channel-discovery'

const validCapability: ChannelCapability = {
  channel: 'pinterest',
  formats: ['imagem estática', 'idea pin'],
  limits: ['máx 500 caracteres descrição'],
  cadence: '3-5 pins/dia',
  dependencies: ['conta social', 'assets visuais', 'API oficial para publicação'],
  metrics: ['impressions', 'saves', 'clicks'],
  risks: ['alcance dependente de SEO visual'],
  integration: 'planned',
  operationalCost: 'medium',
  dataProvenance: [{ field: 'formats', source: 'documentação oficial [fixture]', retrievedAt: '2026-09-22T00:00:00.000Z' }],
}

describe('AB-S5-001/002 — capability map', () => {
  it('capability válida passa', () => expect(validateChannelCapability(validCapability).ok).toBe(true))

  it('dados externos sem fonte/data rejeitam', () => {
    expect(validateChannelCapability({ ...validCapability, dataProvenance: [] }).ok).toBe(false)
    expect(validateChannelCapability({ ...validCapability, dataProvenance: [{ field: 'x', source: '', retrievedAt: '' }] }).ok).toBe(false)
  })

  it("integration 'available' sem contrato oficial é bloqueio explícito", () => {
    const r = validateChannelCapability({ ...validCapability, integration: 'available' })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'CONTRACT_EVIDENCE_REQUIRED')).toBe(true)
  })

  it('formatos/limites/dependências vazios rejeitam', () => {
    expect(validateChannelCapability({ ...validCapability, formats: [] }).ok).toBe(false)
    expect(validateChannelCapability({ ...validCapability, limits: [] }).ok).toBe(false)
    expect(validateChannelCapability({ ...validCapability, dependencies: [] }).ok).toBe(false)
  })
})

describe('AB-S5-003 — sinais de adequação', () => {
  it('score combina sinais ponderados e clampa valores', () => {
    const s = scoreChannelFit({ channel: 'instagram', audienceMatch: 1.5, formatMatch: 0.8, visualMatch: 0.7, cadenceFeasibility: 0.6, objectiveAlignment: 0.9, complianceRisk: 0.2, productionCapacity: 0.7 })
    expect(s.signals.audienceMatch).toBe(1)
    expect(s.score).toBeGreaterThan(0)
    expect(s.score).toBeLessThanOrEqual(1)
  })

  it('sinal desconhecido (0.5) gera incerteza declarada', () => {
    const s = scoreChannelFit({ channel: 'tiktok', audienceMatch: 0.5, formatMatch: 0.5, visualMatch: 0.5, cadenceFeasibility: 0.5, objectiveAlignment: 0.5, complianceRisk: 0.5, productionCapacity: 0.5 })
    expect(s.uncertainties.length).toBe(7)
  })
})

describe('AB-S5-004 — hipóteses de canal', () => {
  it('gera candidatos classificados (rank) com rationale e dados faltantes — não decisão', () => {
    const fits = [
      scoreChannelFit({ channel: 'instagram', audienceMatch: 0.9, formatMatch: 0.8, visualMatch: 0.8, cadenceFeasibility: 0.7, objectiveAlignment: 0.8, complianceRisk: 0.1, productionCapacity: 0.8 }),
      scoreChannelFit({ channel: 'pinterest', audienceMatch: 0.7, formatMatch: 0.6, visualMatch: 0.9, cadenceFeasibility: 0.8, objectiveAlignment: 0.7, complianceRisk: 0.1, productionCapacity: 0.7 }),
    ]
    const hyps = generateChannelHypotheses(fits, { createdBy: 'agent-a' })
    expect(hyps[0].rank).toBe(1)
    expect(hyps[0].status).toBe('proposed')
    expect(hyps[0].rationale.length).toBe(4)
    expect(hyps.every((h) => typeof h.hypothesisId === 'string' && h.hypothesisId.startsWith('hyp-'))).toBe(true)
  })
})

describe('AB-S5-005 — combinações de canais', () => {
  it('compara e ordena por score composto, resultado versionado', () => {
    const combos = compareCombinations([
      { channels: ['instagram', 'pinterest'], potentialReach: 0.8, effort: 0.5, reuse: 0.8, risk: 0.2, cost: 0.3, capacityFit: 0.7 },
      { channels: ['tiktok'], potentialReach: 0.9, effort: 0.8, reuse: 0.4, risk: 0.5, cost: 0.4, capacityFit: 0.4 },
    ])
    expect(combos[0].compositeScore).toBeGreaterThanOrEqual(combos[1].compositeScore)
    expect(combos.every((c) => c.version === 1 && c.combinationId.startsWith('combo-'))).toBe(true)
  })
})
