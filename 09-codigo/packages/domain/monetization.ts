/**
 * SPRINT S6 (backend) — Monetização e eventos de métricas.
 *
 * AB-S6-001 inventário central (item referencia FBR Ads);
 * AB-S6-002 affiliate recommendation com evidência;
 * AB-S6-003 binding editorial (1 affiliate + 1 product ad ou blocked);
 * AB-S6-004 disclosure obrigatório e contextual;
 * AB-S6-005 eventos versionados — número sem origem não é real.
 */
import { FieldValidator, nowIso, type ValidationResult } from '../contracts/common'

// ---------------------------------------------------------------------------
// AB-S6-001 — ad inventory
// ---------------------------------------------------------------------------

export const ALLOWED_AD_FORMATS = ['1250x150', '350x350'] as const
export type AdFormat = (typeof ALLOWED_AD_FORMATS)[number]

export type AdInventoryItem = {
  itemId: string
  advertiser: string
  kind: 'product_ad' | 'affiliate'
  destinationUrl: string
  niche: string
  disclosureRequired: true
  validFrom: string
  validUntil: string
  allowedFormats: AdFormat[]
  status: 'active' | 'paused' | 'expired'
  /** referência ao item no FBR Ads (módulo central, não duplicado aqui) */
  fbrAdsRef: string
}

export function validateAdInventoryItem(item: Partial<AdInventoryItem> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!item) { v.add('item', 'REQUIRED', 'item is required'); return v.result() }
  v.require('itemId', item.itemId)
  v.require('advertiser', item.advertiser)
  v.enum('kind', item.kind, ['product_ad', 'affiliate'] as const)
  if (!item.destinationUrl || !/^https?:\/\/.+/.test(item.destinationUrl)) v.add('destinationUrl', 'INVALID_URL', 'url must be http(s)')
  v.require('niche', item.niche)
  if (item.disclosureRequired !== true) v.add('disclosureRequired', 'INVALID_VALUE', 'must be true')
  if (!item.validFrom || !item.validUntil) { v.add('validity', 'REQUIRED', 'validFrom/validUntil are required') }
  else if (new Date(item.validUntil) <= new Date(item.validFrom)) v.add('validity', 'INVALID_RANGE', 'validUntil must be after validFrom')
  if (!Array.isArray(item.allowedFormats) || item.allowedFormats.length === 0) v.add('allowedFormats', 'REQUIRED_NON_EMPTY', 'at least one format')
  else item.allowedFormats.forEach((f, i) => { if (!(ALLOWED_AD_FORMATS as readonly string[]).includes(f)) v.add(`allowedFormats[${i}]`, 'INVALID_FORMAT', `allowed: ${ALLOWED_AD_FORMATS.join(', ')}`) })
  v.enum('status', item.status, ['active', 'paused', 'expired'] as const)
  v.require('fbrAdsRef', item.fbrAdsRef)
  return v.result()
}

// ---------------------------------------------------------------------------
// AB-S6-002 — affiliate recommendation
// ---------------------------------------------------------------------------

export type AffiliateRecommendation = {
  itemId: string
  intent: string
  disclosure: string
  validUntil: string
  evidence: string[]
  relevance: number // 0..1
}

export function validateAffiliateRecommendation(r: Partial<AffiliateRecommendation> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!r) { v.add('recommendation', 'REQUIRED', 'recommendation is required'); return v.result() }
  v.require('itemId', r.itemId)
  v.require('intent', r.intent)
  v.require('disclosure', r.disclosure)
  if (!r.validUntil || Number.isNaN(new Date(r.validUntil).getTime())) v.add('validUntil', 'INVALID_DATE', 'validUntil must be ISO')
  v.requireNonEmptyArray('evidence', r.evidence)
  if (typeof r.relevance !== 'number' || r.relevance < 0 || r.relevance > 1) v.add('relevance', 'INVALID_RANGE', 'within [0,1]')
  return v.result()
}

/** Item irrelevante bloqueia o job (regra da Story). */
export function affiliateBlocksJob(r: AffiliateRecommendation): boolean {
  return r.relevance < 0.4
}

// ---------------------------------------------------------------------------
// AB-S6-003/004 — binding editorial + disclosure
// ---------------------------------------------------------------------------

export type MonetizationBinding = {
  articleId: string
  affiliateItemId: string | null
  productAdItemId: string | null
  status: 'bound' | 'blocked'
  disclosure: string
}

export function bindMonetization(input: {
  articleId: string
  affiliate: AffiliateRecommendation | null
  productAd: AdInventoryItem | null
  articleNiche: string
  articleIntent: string
}): MonetizationBinding {
  const v = new FieldValidator()
  if (input.affiliate && affiliateBlocksJob(input.affiliate)) v.add('affiliate', 'IRRELEVANT_AFFILIATE', 'relevance below threshold blocks the job')
  if (input.productAd && input.productAd.niche !== input.articleNiche) v.add('productAd', 'NICHE_MISMATCH', 'ad niche must match article niche')
  if (input.productAd && input.productAd.status !== 'active') v.add('productAd', 'INACTIVE_AD', 'ad must be active')
  if (!input.affiliate && !input.productAd) {
    return { articleId: input.articleId, affiliateItemId: null, productAdItemId: null, status: 'blocked', disclosure: 'sem monetização vinculada' }
  }
  if (!v.result().ok) {
    return { articleId: input.articleId, affiliateItemId: null, productAdItemId: null, status: 'blocked', disclosure: `bloqueado: ${v.errors.map((e) => e.code).join(', ')}` }
  }
  const disclosureParts: string[] = []
  if (input.affiliate) disclosureParts.push(input.affiliate.disclosure)
  if (input.productAd) disclosureParts.push(`publicidade: ${input.productAd.advertiser}`)
  return {
    articleId: input.articleId,
    affiliateItemId: input.affiliate?.itemId ?? null,
    productAdItemId: input.productAd?.itemId ?? null,
    status: 'bound',
    disclosure: disclosureParts.join(' | '),
  }
}

/** Disclosure obrigatório e contextual: ausência bloqueia aprovação. */
export function disclosureBlocksApproval(binding: MonetizationBinding, articleBody: string): boolean {
  if (binding.status === 'blocked') return true
  if (!binding.disclosure || binding.disclosure.trim().length === 0) return true
  // contextual: o disclosure precisa aparecer no corpo quando há monetização
  if ((binding.affiliateItemId || binding.productAdItemId) && !articleBody.includes(binding.disclosure)) return true
  return false
}

// ---------------------------------------------------------------------------
// AB-S6-005 — eventos e métricas versionados
// ---------------------------------------------------------------------------

export const METRICS_EVENT_VERSION = 1
export type MetricsEventType = 'view' | 'click' | 'conversion' | 'signup'

export type MetricsEvent = {
  eventId: string
  eventVersion: number
  type: MetricsEventType
  projectId: string
  contentId: string | null
  channel: string | null
  origin: 'measured' | 'estimated' | 'imported'
  occurredAt: string
  value: number
  /** obrigatório quando origin=measured; caso contrário não é dado real */
  readbackRef?: string
}

export function validateMetricsEvent(e: Partial<MetricsEvent> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!e) { v.add('event', 'REQUIRED', 'event is required'); return v.result() }
  v.require('eventId', e.eventId)
  if (e.eventVersion !== METRICS_EVENT_VERSION) v.add('eventVersion', 'UNSUPPORTED_VERSION', `expected ${METRICS_EVENT_VERSION}`)
  v.enum('type', e.type, ['view', 'click', 'conversion', 'signup'] as const)
  v.require('projectId', e.projectId)
  v.enum('origin', e.origin, ['measured', 'estimated', 'imported'] as const)
  if (!e.occurredAt || Number.isNaN(new Date(e.occurredAt).getTime())) v.add('occurredAt', 'INVALID_DATE', 'occurredAt must be ISO')
  if (typeof e.value !== 'number' || e.value < 0) v.add('value', 'INVALID_VALUE', 'value must be >= 0')
  if (e.origin === 'measured' && !e.readbackRef) v.add('readbackRef', 'REQUIRED_FOR_MEASURED', 'measured values require readback reference')
  return v.result()
}

/** Agregação separa real (measured) de estimativa — nunca mistura. */
export function aggregateByOrigin(events: MetricsEvent[]): { measured: number; estimated: number; imported: number } {
  return events.reduce(
    (acc, e) => { acc[e.origin] += e.value; return acc },
    { measured: 0, estimated: 0, imported: 0 },
  )
}
