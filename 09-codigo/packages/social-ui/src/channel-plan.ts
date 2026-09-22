/**
 * Channel Plan derivado (AB-S5-006), variantes por canal (AB-S5-007) e approval package social (AB-S5-008).
 */
import { findChannel, channelPublishBlocker } from './capability-map'

export const CHANNEL_PLAN_UI_VERSION = 1

export type ChannelPlanStatus = 'candidate' | 'in-analysis' | 'approved' | 'rejected' | 'suspended'

export type SocialChannelPlan = {
  planId: string
  projectId: string
  channelId: string
  objective: string
  formats: string[]
  cadence: string
  ctaStrategy: string
  tone: string
  assetsRequired: string[]
  approvalRequired: boolean
  metrics: string[]
  status: ChannelPlanStatus
  derivedFrom: { recommendationRunId?: string; fitScore?: number }
  decidedAt?: string
  decidedBy?: string
  rejectReason?: string
}

export function createChannelPlan(input: Omit<SocialChannelPlan, 'status' | 'approvalRequired'> & { status?: ChannelPlanStatus }): SocialChannelPlan {
  const channel = findChannel(input.channelId)
  if (!channel) throw new Error(`canal "${input.channelId}" não existe no catálogo versionado`)
  if (!input.planId?.trim() || !input.projectId?.trim()) throw new Error('planId e projectId são obrigatórios')
  if (!input.objective?.trim()) throw new Error('objetivo é obrigatório')
  if (!Array.isArray(input.formats) || input.formats.length === 0) throw new Error('formats não pode ser vazio')
  const invalid = input.formats.filter(f => !channel.formats.includes(f as never))
  if (invalid.length) throw new Error(`formatos ${invalid.join(', ')} não suportados por ${input.channelId}`)
  if (!input.cadence?.trim() || !input.tone?.trim()) throw new Error('cadence e tone são obrigatórios')
  return { ...input, status: input.status ?? 'candidate', approvalRequired: true }
}

export function decideChannelPlan(plan: SocialChannelPlan, decision: 'approve' | 'reject' | 'suspend', actor: string, reason?: string): SocialChannelPlan {
  if (!actor?.trim()) throw new Error('ator da decisão é obrigatório')
  if (decision === 'reject' && !reason?.trim()) throw new Error('rejeição exige motivo')
  const status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'suspended'
  return { ...plan, status, decidedAt: new Date(0).toISOString(), decidedBy: actor, ...(decision === 'reject' ? { rejectReason: reason } : {}) }
}

/** Variantes por canal (AB-S5-007): adaptação, não cópia cega. */
export type ContentOrigin = {
  originId: string
  kind: 'article' | 'guide' | 'comparison' | 'newsletter'
  title: string
  url: string
  keyPoints: string[]
  disclosureRequired: boolean
}

export type ChannelVariant = {
  variantId: string
  originId: string
  channelId: string
  format: string
  text: string
  mediaAssetIds?: string[]
  cta: string
  disclosure?: string
  charCount: number
  status: 'draft' | 'in-review' | 'approved-for-package' | 'rejected'
  derivedFrom: { originVersion: string }
}

export function createChannelVariant(input: {
  variantId: string; origin: ContentOrigin; channelId: string; format: string; text: string; cta: string
}): ChannelVariant {
  const channel = findChannel(input.channelId)
  if (!channel) throw new Error(`canal "${input.channelId}" não existe`)
  if (!channel.formats.includes(input.format as never)) throw new Error(`formato ${input.format} não suportado por ${input.channelId}`)
  const maxChars = channel.limits.maxTextChars ?? 1000
  if (input.text.length > maxChars) throw new Error(`texto com ${input.text.length} chars excede limite de ${maxChars} do canal ${input.channelId}`)
  if (input.origin.disclosureRequired && !input.text.includes('afiliad')) {
    throw new Error('conteúdo de origem com afiliado exige disclosure na variante')
  }
  if (!input.cta?.trim()) throw new Error('CTA é obrigatório')
  return {
    variantId: input.variantId, originId: input.origin.originId, channelId: input.channelId,
    format: input.format, text: input.text, cta: input.cta,
    disclosure: input.origin.disclosureRequired ? 'Contém links de afiliado. Podemos receber comissão.' : undefined,
    charCount: input.text.length, status: 'draft',
    derivedFrom: { originVersion: input.origin.originId },
  }
}

/** Approval package social (AB-S5-008): agrupa texto, mídia, canal, risco, fontes, CTA e status; publicação bloqueada sem Gate. */
export type ApprovalPackageStatus = 'assembling' | 'ready-for-gate' | 'gated-approved' | 'rejected'

export type SocialApprovalPackage = {
  packageId: string
  projectId: string
  variantIds: string[]
  channelIds: string[]
  mediaAssetIds: string[]
  riskNotes: string[]
  sourceIds: string[]
  ctas: string[]
  disclosurePresent: boolean
  status: ApprovalPackageStatus
  gate: { required: true; gateOwner: 'sergio'; reason: string }
  blockers: string[]
}

export function assembleSocialApprovalPackage(input: {
  packageId: string; projectId: string; variants: ChannelVariant[]; mediaAssetIds?: string[]; sourceIds?: string[]; riskNotes?: string[]
}): SocialApprovalPackage {
  const blockers: string[] = []
  if (!input.packageId?.trim() || !input.projectId?.trim()) blockers.push('packageId e projectId são obrigatórios')

  const variantIds = input.variants.map(v => v.variantId)
  if (input.variants.length === 0) blockers.push('pacote sem variantes')

  for (const v of input.variants) {
    if (v.status !== 'approved-for-package') blockers.push(`variante ${v.variantId} não está aprovada para pacote (status: ${v.status})`)
    const pub = channelPublishBlocker(v.channelId)
    if (pub.blocked) blockers.push(`${v.variantId}: ${pub.reason}`)
  }

  const channelIds = [...new Set(input.variants.map(v => v.channelId))]
  const ctas = input.variants.map(v => v.cta)
  const disclosurePresent = input.variants.some(v => v.disclosure !== undefined)

  return {
    packageId: input.packageId, projectId: input.projectId, variantIds, channelIds,
    mediaAssetIds: input.mediaAssetIds ?? [], riskNotes: input.riskNotes ?? [], sourceIds: input.sourceIds ?? [],
    ctas, disclosurePresent,
    status: blockers.length === 0 ? 'ready-for-gate' : 'assembling',
    gate: { required: true, gateOwner: 'sergio', reason: 'publicação social exige Gate humano (Sergio) e contrato oficial do canal' },
    blockers,
  }
}

/** Gate explícito: nenhuma API de publicação é chamada por esta package. */
export function assertPublishBlocked(pkg: SocialApprovalPackage): { blocked: boolean; reason: string } {
  return { blocked: true, reason: `publicação social permanece bloqueada; pacote ${pkg.packageId} exige Gate humano (owner: sergio)` }
}
