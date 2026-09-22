/**
 * AB-S0-001 / AB-S0-002 / AB-S0-003 — Contrato de intake de Persona do Authority.
 *
 * Fonte dos requisitos:
 * - `02-prd/SPRINTS-STORIES-AUDIENCE-BUILDER.md` (S0.1, S0.2)
 * - `03-arquitetura/authority-blogs-flux-contract.md` (seções 3.1–3.6)
 * - `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`
 *
 * Contrato versionado: `audience-builder.persona-intake.v1`.
 * Fixtures são permitidas somente com `meta.testOnly = true` e nunca
 * habilitam produção (ver `release-gate.ts`).
 */
import { FieldValidator, isCanonicalHash, isIsoDate, type CanonicalHash, type ValidationResult } from './common'

export const PERSONA_INTAKE_CONTRACT_VERSION = 1
export const PERSONA_INTAKE_CONTRACT_ID = 'audience-builder.persona-intake.v1'

// ---------------------------------------------------------------------------
// S0.1.a / S0.1.b — estados canônicos da Persona
// ---------------------------------------------------------------------------

/** Único estado aceito (equivalente canônico de `approved`). */
export const PERSONA_STATUSES_ACCEPTED = ['approved'] as const

/** Estados rejeitados com razão estruturada. */
export const PERSONA_STATUSES_REJECTED = ['draft', 'generating', 'stale', 'rejected', 'archived'] as const

export type AcceptedPersonaStatus = (typeof PERSONA_STATUSES_ACCEPTED)[number]
export type RejectedPersonaStatus = (typeof PERSONA_STATUSES_REJECTED)[number]
export type PersonaStatus = AcceptedPersonaStatus | RejectedPersonaStatus | (string & {})

export type PersonaEligibilityReasonCode =
  | 'PERSONA_NOT_APPROVED'
  | 'UNKNOWN_PERSONA_STATUS'
  | 'PERSONA_VERSION_REQUIRED'
  | 'PERSONA_VERSION_ID_REQUIRED'
  | 'CONTENT_HASH_REQUIRED'
  | 'CONTENT_HASH_INVALID_FORMAT'
  | 'APPROVAL_EVIDENCE_REQUIRED'
  | 'APPROVAL_DOES_NOT_COVER_VERSION'

export type PersonaEligibilityDecision = {
  eligible: boolean
  reason: { code: PersonaEligibilityReasonCode; details: Record<string, unknown> } | null
}

// ---------------------------------------------------------------------------
// S0.2 — pacote canônico (schema do snapshot recebido)
// ---------------------------------------------------------------------------

/** S0.2.c — evidência da aprovação (ator, data, escopo, versões). */
export type PersonaApprovalEvidence = {
  approvalId: string
  approvedBy: string
  approvedAt: string
  approvalScope: string
  approvedVersions: string[]
  comment?: string
}

/** S0.2.b — Character Bible (herdado, não regenerado pelo Audience Builder). */
export type CharacterBible = {
  name: string
  bio: string
  originStory: string
  mission: string
  positioning: string
  centralPromise: string
  values: string[]
  tensions: string[]
}

/** S0.2.c — Physical Identity Bible. */
export type PhysicalIdentityBible = {
  physicalDescription: string
  continuityAnchors: string[]
  avatarReferenceAssetIds: string[]
}

/** S0.2.d — Visual Consistency Profile. */
export type VisualConsistencyProfile = {
  styleTokens: string[]
  visualPrompts: string[]
  negativePrompts: string[]
  aiDisclosure: string
}

/** S0.2.e — Editorial Profile. */
export type PersonaEditorialProfile = {
  voice: string
  vocabulary: string[]
  recurringExpressions: string[]
  audience: string[]
  painPoints: string[]
  desires: string[]
  fears: string[]
  objections: string[]
  editorialPillars: string[]
  priorityTopics: string[]
  prohibitedTopics: string[]
  claims: Array<{ text: string; allowed: boolean; condition?: string }>
  guardrails: string[]
  qualityCriteria: string[]
  reviewCriteria: string[]
}

/** S0.2.f — Channel Plans (blog obrigatório; social/youtube como plano, nunca conta real). */
export type PersonaChannelPlan = {
  channel: 'blog' | 'social' | 'youtube'
  objective: string
  audience: string[]
  formats: string[]
  cadence: string
  pillars: string[]
  disclosure: string
  constraints: string[]
  plan?: string
  /** Status de plano: `configured`/`planned` NÃO autoriza criação de conta. */
  planStatus: 'planned' | 'configured'
  versionId: string
}

/** S0.2.g — nichos potenciais com evidência e limitação declaradas. */
export type PotentialNiche = {
  nicheId: string
  label: string
  origin: string
  observedAt: string
  confidence: number
  evidence: string[]
  limitations: string[]
  signals: string[]
}

/** S0.2.h — claims/guardrails já cobertos no editorial profile; disclosure explícito aqui. */
export type PersonaDisclosurePolicy = {
  aiDisclosureRequired: boolean
  affiliateDisclosureTemplate: string
  sensitiveTopicsPolicy: string
}

export type PersonaIntakeMeta = {
  /** Fixture/test-only: nunca valida produção. */
  testOnly: boolean
  sourceRunIds?: string[]
  authorityProjectId?: string
  ownerId?: string
}

/**
 * Pacote completo recebido do Authority (AB-S0-003).
 * `contentHash` cobre a porção `snapshot` e é recalculável via
 * `computeContentHash(pkg.snapshot)` (AB-S0-002).
 */
export type PersonaIntakePackage = {
  contractVersion: number
  personaId: string
  personaVersionId: string
  personaVersion: number
  status: PersonaStatus
  contentHash: CanonicalHash
  approval: PersonaApprovalEvidence
  snapshot: {
    characterBible: CharacterBible
    physicalIdentityBible: PhysicalIdentityBible
    visualConsistencyProfile: VisualConsistencyProfile
    editorialProfile: PersonaEditorialProfile
    channelPlans: { blog: PersonaChannelPlan; social: PersonaChannelPlan; youtube: PersonaChannelPlan }
    potentialNiches: PotentialNiche[]
    disclosurePolicy: PersonaDisclosurePolicy
  }
  meta: PersonaIntakeMeta
}

// ---------------------------------------------------------------------------
// AB-S0-001 — elegibilidade (estados válidos, inválidos e desconhecidos)
// ---------------------------------------------------------------------------

export function decidePersonaEligibility(pkg: Partial<PersonaIntakePackage> | null | undefined): PersonaEligibilityDecision {
  if (!pkg) {
    return { eligible: false, reason: { code: 'APPROVAL_EVIDENCE_REQUIRED', details: { missing: 'package' } } }
  }
  // ordem deliberada: primeiro identidade/versão/hash, depois estado, depois aprovação
  if (!pkg.personaVersionId || typeof pkg.personaVersionId !== 'string') {
    return { eligible: false, reason: { code: 'PERSONA_VERSION_ID_REQUIRED', details: {} } }
  }
  if (pkg.personaVersion === undefined || pkg.personaVersion === null || !Number.isFinite(pkg.personaVersion) || pkg.personaVersion < 1) {
    return { eligible: false, reason: { code: 'PERSONA_VERSION_REQUIRED', details: { personaVersion: pkg.personaVersion ?? null } } }
  }
  if (!pkg.contentHash) {
    return { eligible: false, reason: { code: 'CONTENT_HASH_REQUIRED', details: {} } }
  }
  if (!isCanonicalHash(pkg.contentHash)) {
    return { eligible: false, reason: { code: 'CONTENT_HASH_INVALID_FORMAT', details: { contentHash: pkg.contentHash } } }
  }
  const status = pkg.status
  if (typeof status !== 'string' || status.length === 0) {
    return { eligible: false, reason: { code: 'UNKNOWN_PERSONA_STATUS', details: { status: null } } }
  }
  if ((PERSONA_STATUSES_REJECTED as readonly string[]).includes(status)) {
    return { eligible: false, reason: { code: 'PERSONA_NOT_APPROVED', details: { status } } }
  }
  if (!(PERSONA_STATUSES_ACCEPTED as readonly string[]).includes(status)) {
    return { eligible: false, reason: { code: 'UNKNOWN_PERSONA_STATUS', details: { status } } }
  }
  const approval = pkg.approval
  if (!approval || !approval.approvalId || !approval.approvedBy || !approval.approvedAt || !isIsoDate(approval.approvedAt)) {
    return { eligible: false, reason: { code: 'APPROVAL_EVIDENCE_REQUIRED', details: {} } }
  }
  if (!Array.isArray(approval.approvedVersions) || !approval.approvedVersions.includes(pkg.personaVersionId)) {
    return { eligible: false, reason: { code: 'APPROVAL_DOES_NOT_COVER_VERSION', details: { personaVersionId: pkg.personaVersionId } } }
  }
  return { eligible: true, reason: null }
}

// ---------------------------------------------------------------------------
// AB-S0-002 — versão imutável + hash (igualdade, divergência, replay)
// ---------------------------------------------------------------------------

export type SnapshotIntakeOutcome =
  | { outcome: 'accepted'; personaVersionId: string; contentHash: CanonicalHash }
  | { outcome: 'replay'; personaVersionId: string; contentHash: CanonicalHash }
  | { outcome: 'divergent'; code: 'SNAPSHOT_HASH_DIVERGENT'; personaVersionId: string }
  | { outcome: 'stale_version'; code: 'PERSONA_VERSION_SUPERSEDED'; personaVersionId: string }

/**
 * Compara um pacote recebido contra o binding vigente.
 * - mesma versão + mesmo hash → `replay` (idempotente)
 * - mesma versionId + hash divergente → `divergent` (bloqueia consumo)
 * - versionId diferente → `stale_version` (exige novo binding/nova aprovação)
 */
export function compareAgainstBinding(
  pkg: Pick<PersonaIntakePackage, 'personaVersionId' | 'contentHash'>,
  binding: { personaVersionId: string; contentHash: CanonicalHash } | null | undefined,
): SnapshotIntakeOutcome {
  if (!binding) {
    return { outcome: 'accepted', personaVersionId: pkg.personaVersionId, contentHash: pkg.contentHash }
  }
  if (binding.personaVersionId === pkg.personaVersionId) {
    return binding.contentHash === pkg.contentHash
      ? { outcome: 'replay', personaVersionId: pkg.personaVersionId, contentHash: pkg.contentHash }
      : { outcome: 'divergent', code: 'SNAPSHOT_HASH_DIVERGENT', personaVersionId: pkg.personaVersionId }
  }
  return { outcome: 'stale_version', code: 'PERSONA_VERSION_SUPERSEDED', personaVersionId: binding.personaVersionId }
}

// ---------------------------------------------------------------------------
// AB-S0-003 — validação completa do pacote (campo a campo)
// ---------------------------------------------------------------------------

export function validatePersonaIntakePackage(pkg: Partial<PersonaIntakePackage> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!pkg || typeof pkg !== 'object') {
    v.add('package', 'PACKAGE_REQUIRED', 'persona intake package is required')
    return v.result()
  }
  if (pkg.contractVersion !== PERSONA_INTAKE_CONTRACT_VERSION) {
    v.add('contractVersion', 'UNSUPPORTED_CONTRACT_VERSION', `expected ${PERSONA_INTAKE_CONTRACT_VERSION}`)
  }
  v.require('personaId', pkg.personaId)
  v.require('personaVersionId', pkg.personaVersionId)
  if (!Number.isFinite(pkg.personaVersion) || (pkg.personaVersion ?? 0) < 1) v.add('personaVersion', 'INVALID_VERSION', 'personaVersion must be >= 1')
  const eligibility = decidePersonaEligibility(pkg)
  if (!eligibility.eligible && eligibility.reason) {
    // status/aprovação já cobertos pela elegibilidade; reportamos como erro de campo
    v.add('status', eligibility.reason.code, `persona not eligible: ${eligibility.reason.code}`)
  }
  if (!pkg.contentHash || !isCanonicalHash(pkg.contentHash)) v.add('contentHash', 'CONTENT_HASH_INVALID_FORMAT', 'expected sha256:<64hex>')
  if (pkg.approval) {
    v.require('approval.approvalId', pkg.approval.approvalId)
    v.require('approval.approvedBy', pkg.approval.approvedBy)
    if (!isIsoDate(String(pkg.approval.approvedAt))) v.add('approval.approvedAt', 'INVALID_DATE', 'approvedAt must be ISO-8601')
    v.require('approval.approvalScope', pkg.approval.approvalScope)
    v.requireNonEmptyArray('approval.approvedVersions', pkg.approval.approvedVersions)
  }
  const s = pkg.snapshot
  if (!s) {
    v.add('snapshot', 'REQUIRED', 'snapshot is required')
    return v.result()
  }
  // Character Bible
  const cb = s.characterBible
  if (!cb) v.add('snapshot.characterBible', 'REQUIRED', 'characterBible is required')
  else {
    for (const f of ['name', 'bio', 'originStory', 'mission', 'positioning', 'centralPromise'] as const) v.require(`snapshot.characterBible.${f}`, cb[f])
    v.requireNonEmptyArray('snapshot.characterBible.values', cb.values)
  }
  // Physical Identity Bible
  const pib = s.physicalIdentityBible
  if (!pib) v.add('snapshot.physicalIdentityBible', 'REQUIRED', 'physicalIdentityBible is required')
  else {
    v.require('snapshot.physicalIdentityBible.physicalDescription', pib.physicalDescription)
    v.requireNonEmptyArray('snapshot.physicalIdentityBible.continuityAnchors', pib.continuityAnchors)
    if (!Array.isArray(pib.avatarReferenceAssetIds)) v.add('snapshot.physicalIdentityBible.avatarReferenceAssetIds', 'REQUIRED', 'must be an array (may be empty)')
  }
  // Visual Consistency Profile
  const vcp = s.visualConsistencyProfile
  if (!vcp) v.add('snapshot.visualConsistencyProfile', 'REQUIRED', 'visualConsistencyProfile is required')
  else {
    v.requireNonEmptyArray('snapshot.visualConsistencyProfile.styleTokens', vcp.styleTokens)
    v.requireNonEmptyArray('snapshot.visualConsistencyProfile.visualPrompts', vcp.visualPrompts)
    if (!Array.isArray(vcp.negativePrompts)) v.add('snapshot.visualConsistencyProfile.negativePrompts', 'REQUIRED', 'must be an array')
    v.require('snapshot.visualConsistencyProfile.aiDisclosure', vcp.aiDisclosure)
  }
  // Editorial Profile
  const ep = s.editorialProfile
  if (!ep) v.add('snapshot.editorialProfile', 'REQUIRED', 'editorialProfile is required')
  else {
    v.require('snapshot.editorialProfile.voice', ep.voice)
    for (const f of ['vocabulary', 'audience', 'painPoints', 'desires', 'editorialPillars', 'priorityTopics', 'guardrails', 'qualityCriteria', 'reviewCriteria'] as const) {
      v.requireNonEmptyArray(`snapshot.editorialProfile.${f}`, ep[f])
    }
    v.requireNonEmptyArray('snapshot.editorialProfile.prohibitedTopics', ep.prohibitedTopics, 'REQUIRED_NON_EMPTY')
    if (!Array.isArray(ep.claims)) v.add('snapshot.editorialProfile.claims', 'REQUIRED', 'claims array is required')
  }
  // Channel Plans — blog/social/youtube obrigatórios
  const plans = s.channelPlans
  if (!plans) v.add('snapshot.channelPlans', 'REQUIRED', 'channelPlans is required')
  else {
    for (const channel of ['blog', 'social', 'youtube'] as const) {
      const plan = plans[channel]
      if (!plan) v.add(`snapshot.channelPlans.${channel}`, 'REQUIRED', `${channel} channel plan is required`)
      else {
        if (plan.channel !== channel) v.add(`snapshot.channelPlans.${channel}.channel`, 'INVALID_VALUE', `expected channel '${channel}'`)
        v.require(`snapshot.channelPlans.${channel}.objective`, plan.objective)
        v.requireNonEmptyArray(`snapshot.channelPlans.${channel}.formats`, plan.formats)
        v.require(`snapshot.channelPlans.${channel}.cadence`, plan.cadence)
        v.require(`snapshot.channelPlans.${channel}.disclosure`, plan.disclosure)
        v.require(`snapshot.channelPlans.${channel}.versionId`, plan.versionId)
        v.enum(`snapshot.channelPlans.${channel}.planStatus`, plan.planStatus, ['planned', 'configured'] as const)
      }
    }
  }
  // Nichos potenciais — podem ser vazios, mas cada um precisa de origem/data/confiança/limitação
  if (!Array.isArray(s.potentialNiches)) v.add('snapshot.potentialNiches', 'REQUIRED', 'potentialNiches must be an array')
  else {
    s.potentialNiches.forEach((n, i) => {
      const base = `snapshot.potentialNiches[${i}]`
      v.require(`${base}.nicheId`, n?.nicheId)
      v.require(`${base}.label`, n?.label)
      v.require(`${base}.origin`, n?.origin)
      if (!n || !isIsoDate(String(n.observedAt))) v.add(`${base}.observedAt`, 'INVALID_DATE', 'observedAt must be ISO-8601')
      if (!n || typeof n.confidence !== 'number' || n.confidence < 0 || n.confidence > 1) v.add(`${base}.confidence`, 'INVALID_RANGE', 'confidence must be within [0,1]')
      if (!n || !Array.isArray(n.limitations) || n.limitations.length === 0) v.add(`${base}.limitations`, 'REQUIRED_NON_EMPTY', 'limitations must declare at least one constraint')
      if (!n || !Array.isArray(n.evidence)) v.add(`${base}.evidence`, 'REQUIRED', 'evidence must be an array')
    })
  }
  // Disclosure policy
  const dp = s.disclosurePolicy
  if (!dp) v.add('snapshot.disclosurePolicy', 'REQUIRED', 'disclosurePolicy is required')
  else {
    v.require('snapshot.disclosurePolicy.affiliateDisclosureTemplate', dp.affiliateDisclosureTemplate)
    v.require('snapshot.disclosurePolicy.sensitiveTopicsPolicy', dp.sensitiveTopicsPolicy)
    if (typeof dp.aiDisclosureRequired !== 'boolean') v.add('snapshot.disclosurePolicy.aiDisclosureRequired', 'INVALID_TYPE', 'must be boolean')
  }
  // Meta — testOnly obrigatório (bool explícito)
  if (!pkg.meta || typeof pkg.meta.testOnly !== 'boolean') v.add('meta.testOnly', 'REQUIRED', 'meta.testOnly must be an explicit boolean')
  return v.result()
}
