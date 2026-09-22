/**
 * SPRINT S6 backend — inventário, afiliados, binding editorial, disclosure,
 * eventos de métricas.
 */
import { describe, expect, it } from 'vitest'
import {
  affiliateBlocksJob,
  aggregateByOrigin,
  bindMonetization,
  disclosureBlocksApproval,
  validateAdInventoryItem,
  validateAffiliateRecommendation,
  validateMetricsEvent,
  type AdInventoryItem,
  type AffiliateRecommendation,
  type MetricsEvent,
} from '../../packages/domain/monetization'

const validAd: AdInventoryItem = {
  itemId: 'ad-1',
  advertiser: 'Loja Fixture [fixture]',
  kind: 'product_ad',
  destinationUrl: 'https://example.com/produto',
  niche: 'contratos auditáveis',
  disclosureRequired: true,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-12-01T00:00:00.000Z',
  allowedFormats: ['350x350'],
  status: 'active',
  fbrAdsRef: 'fbr-ads://item-1',
}

const validAffiliate: AffiliateRecommendation = {
  itemId: 'aff-1',
  intent: 'commercial',
  disclosure: 'Contém link de afiliado. [fixture]',
  validUntil: '2026-12-01T00:00:00.000Z',
  evidence: ['evidência de relevância [fixture]'],
  relevance: 0.8,
}

describe('AB-S6-001 — ad inventory', () => {
  it('item válido passa com formatos contratados', () => expect(validateAdInventoryItem(validAd).ok).toBe(true))
  it('formato fora do contrato rejeita', () => {
    expect(validateAdInventoryItem({ ...validAd, allowedFormats: ['700x300' as never] }).errors.some((e) => e.code === 'INVALID_FORMAT')).toBe(true)
  })
  it('disclosure obrigatório inalterável', () => {
    expect(validateAdInventoryItem({ ...validAd, disclosureRequired: false as never }).ok).toBe(false)
  })
  it('validade invertida rejeita', () => {
    expect(validateAdInventoryItem({ ...validAd, validFrom: '2026-12-01T00:00:00.000Z', validUntil: '2026-09-01T00:00:00.000Z' }).ok).toBe(false)
  })
})

describe('AB-S6-002 — affiliate recommendation', () => {
  it('recomendação válida passa', () => expect(validateAffiliateRecommendation(validAffiliate).ok).toBe(true))
  it('sem evidência rejeita', () => expect(validateAffiliateRecommendation({ ...validAffiliate, evidence: [] }).ok).toBe(false))
  it('item irrelevante bloqueia o job', () => {
    expect(affiliateBlocksJob({ ...validAffiliate, relevance: 0.2 })).toBe(true)
    expect(affiliateBlocksJob(validAffiliate)).toBe(false)
  })
})

describe('AB-S6-003 — binding editorial', () => {
  it('artigo referencia 1 affiliate + 1 product ad', () => {
    const b = bindMonetization({ articleId: 'a1', affiliate: validAffiliate, productAd: validAd, articleNiche: 'contratos auditáveis', articleIntent: 'commercial' })
    expect(b.status).toBe('bound')
    expect(b.affiliateItemId).toBe('aff-1')
    expect(b.productAdItemId).toBe('ad-1')
  })

  it('sem monetização fica blocked (não vazio)', () => {
    const b = bindMonetization({ articleId: 'a1', affiliate: null, productAd: null, articleNiche: 'x', articleIntent: 'y' })
    expect(b.status).toBe('blocked')
  })

  it('ad de nicho divergente bloqueia', () => {
    const b = bindMonetization({ articleId: 'a1', affiliate: null, productAd: validAd, articleNiche: 'outro nicho', articleIntent: 'x' })
    expect(b.status).toBe('blocked')
  })

  it('afiliado irrelevante bloqueia job', () => {
    const b = bindMonetization({ articleId: 'a1', affiliate: { ...validAffiliate, relevance: 0.1 }, productAd: null, articleNiche: 'x', articleIntent: 'y' })
    expect(b.status).toBe('blocked')
    expect(b.disclosure).toContain('IRRELEVANT_AFFILIATE')
  })
})

describe('AB-S6-004 — disclosure', () => {
  const bound = bindMonetization({ articleId: 'a1', affiliate: validAffiliate, productAd: validAd, articleNiche: 'contratos auditáveis', articleIntent: 'x' })
  const bodyWith = `Introdução. ${bound.disclosure} Conclusão.`

  it('disclosure presente no corpo libera', () => {
    expect(disclosureBlocksApproval(bound, bodyWith)).toBe(false)
  })
  it('ausência no corpo bloqueia aprovação (contextual)', () => {
    expect(disclosureBlocksApproval(bound, 'corpo sem disclosure')).toBe(true)
  })
  it('binding bloqueado impede aprovação', () => {
    const blocked = bindMonetization({ articleId: 'a1', affiliate: null, productAd: null, articleNiche: 'x', articleIntent: 'y' })
    expect(disclosureBlocksApproval(blocked, 'qualquer corpo')).toBe(true)
  })
})

describe('AB-S6-005 — eventos e métricas', () => {
  const validEvent: MetricsEvent = {
    eventId: 'ev-1',
    eventVersion: 1,
    type: 'click',
    projectId: 'ap-1',
    contentId: 'draft-1',
    channel: 'blog',
    origin: 'measured',
    occurredAt: '2026-09-22T00:00:00.000Z',
    value: 3,
    readbackRef: 'analytics-readback-1',
  }

  it('evento medido com readback passa', () => expect(validateMetricsEvent(validEvent).ok).toBe(true))
  it('evento medido sem readback rejeita (número não é real sem origem)', () => {
    expect(validateMetricsEvent({ ...validEvent, readbackRef: undefined }).errors.some((e) => e.code === 'REQUIRED_FOR_MEASURED')).toBe(true)
  })
  it('estimativa não exige readback mas é marcada como tal', () => {
    expect(validateMetricsEvent({ ...validEvent, origin: 'estimated', readbackRef: undefined }).ok).toBe(true)
  })
  it('agregação separa real de estimado', () => {
    const agg = aggregateByOrigin([
      { ...validEvent, origin: 'measured', value: 10 },
      { ...validEvent, eventId: 'ev-2', origin: 'estimated', value: 50 },
    ])
    expect(agg).toEqual({ measured: 10, estimated: 50, imported: 0 })
  })
})
