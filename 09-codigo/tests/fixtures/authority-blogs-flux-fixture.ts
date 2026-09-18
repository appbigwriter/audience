/**
 * Local fake fixture for the Authority → Flux → Blogs v1 adapter contract.
 *
 * Proves the reconciliation described in
 * `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`:
 * the ID-only `persona.approved` envelope (Track A) is enriched by Flux with the
 * approved read model fetched from Authority, producing the full
 * `AuthorityPersonaBindingInput` snapshot binding (Track B).
 *
 * Shapes mirror, field-for-field:
 * - Authority `PersonaApprovedEventEnvelope` / `PersonaReadModel`
 *   (`AuthorityEngine/09-codigo/src/persona-contract.ts`)
 * - Flux `PersonaApprovedEnvelope` (`FBR Agency Flux/09-codigo/src/lib/persona-approved.ts`)
 * - Blogs `AuthorityPersonaBindingInput` (`FBR Blogs/09-codigo/lib/persona-binding.ts`)
 *
 * No real identifiers, no secrets, no external calls. Deterministic fixture IDs only.
 */

// ---------------------------------------------------------------------------
// Authority side — emitted persona.approved envelope (IDs only)
// ---------------------------------------------------------------------------

export const fakeAuthorityEvent = {
  event_id: 'fixture-persona-approved-1',
  event_type: 'persona.approved',
  event_version: 1,
  occurred_at: '2026-09-18T12:00:00.000Z',
  source: 'authority-engine',
  aggregate_type: 'persona',
  aggregate_id: 'fixture-persona-1',
  aggregate_version: 3,
  correlation_id: 'fixture-corr-1',
  causation_id: null,
  payload: {
    persona_id: 'fixture-persona-1',
    persona_version_id: 'fixture-persona-version-3',
    blog_id: 'fixture-blog-1',
    blog_name_version_id: 'fixture-blog-name-1',
  },
}

// ---------------------------------------------------------------------------
// Authority side — approved read model returned by
// GET /api/personas/:personaId/read-model (approved version only)
// ---------------------------------------------------------------------------

export const fakeAuthorityReadModel = {
  persona_id: 'fixture-persona-1',
  persona_version_id: 'fixture-persona-version-3',
  persona_version: 3,
  status: 'approved',
  content_hash: 'a'.repeat(64),
  snapshot: {
    input: { name: 'Cinema com Evidência', thesis: 'authority through useful evidence' },
    outputs: {
      identity: { name: 'Cinema com Evidência', thesis: 'authority through useful evidence' },
      voice: { tone: 'clear', identity: { name: 'Cinema com Evidência', thesis: 'authority through useful evidence' } },
      consistency: { checks: ['identity', 'voice'] },
    },
    source_run_ids: ['fixture-module-run-1', 'fixture-module-run-2', 'fixture-module-run-3'],
    consistency_review: { status: 'passed', checkedModuleKeys: ['identity', 'voice', 'consistency'], issues: [], checkedAt: '2026-09-18T11:00:00.000Z' },
  },
}

// ---------------------------------------------------------------------------
// Blogs side — editorial snapshot derived from the read model (v1 mapping)
// ---------------------------------------------------------------------------

export const fakeBlogsEditorialSnapshot = {
  snapshotHash: `sha256:${fakeAuthorityReadModel.content_hash}`,
  personaName: 'Cinema com Evidência',
  bio: 'Persona aprovada dedicada a cinema com evidência.',
  positioning: 'Análise de cinema baseada em evidência',
  centralPromise: 'Críticas úteis sem spoiler desnecessário',
  audience: ['adultos interessados em cinema'],
  voice: 'clear',
  vocabulary: ['filme', 'cinema'],
  editorialPillars: ['críticas com evidência'],
  priorityTopics: ['cinema'],
  prohibitedTopics: ['pirataria'],
  guardrails: ['sem claims não suportados'],
  qualityCriteria: ['fontes verificáveis'],
  reviewCriteria: ['revisão humana antes de publicar'],
  blogChannelPlan: {
    objective: 'informar com evidência',
    audience: ['adultos interessados em cinema'],
    formats: ['guia'],
    cadence: '3/semana',
    pillars: ['críticas com evidência'],
    disclosure: 'transparência sobre uso de IA',
    constraints: [],
    plan: 'editorial',
  },
  socialChannelPlan: {
    versionId: 'fixture-social-plan-1',
    status: 'planned',
    objective: 'distribuir análises',
    audience: ['adultos interessados em cinema'],
    formats: ['post'],
    cadence: 'semanal',
    pillars: ['críticas com evidência'],
    disclosure: 'transparência sobre uso de IA',
    constraints: [],
  },
  youtubeChannelPlan: {
    versionId: 'fixture-youtube-plan-1',
    status: 'planned',
    objective: 'vídeo-análise',
    audience: ['adultos interessados em cinema'],
    formats: ['vídeo'],
    cadence: 'mensal',
    pillars: ['críticas com evidência'],
    disclosure: 'transparência sobre uso de IA',
    constraints: [],
  },
}

// ---------------------------------------------------------------------------
// Flux side — the v1 binding request assembled by the Flux adapter from
// event (IDs) + read model (full snapshot) + Flux job context.
// Shape = Blogs `AuthorityPersonaBindingInput` (contractVersion 1).
// ---------------------------------------------------------------------------

export const fakeFluxBindingRequest = {
  contractVersion: 1,
  idempotencyKey: 'fixture-persona-approved-1',
  eventId: 'fixture-persona-approved-1',
  tenantId: 'fixture-tenant-1',
  fluxProjectId: 'fixture-flux-project-1',
  correlationId: 'fixture-corr-1',
  causationId: null,
  sourceEventId: 'fixture-persona-approved-1',
  authorityProjectId: 'fixture-authority-project-1',
  personaId: 'fixture-persona-1',
  personaVersionId: 'fixture-persona-version-3',
  personaVersion: 3,
  personaStatus: 'approved',
  personaSnapshotHash: `sha256:${fakeAuthorityReadModel.content_hash}`,
  personaApprovalId: 'fixture-approval-pack-1',
  approvedBy: 'sergio',
  approvedAt: '2026-09-18T11:30:00.000Z',
  approvalScope: 'persona_version',
  approvedVersions: ['fixture-persona-version-3'],
  blog: {
    name: 'Cinema com Evidência',
    slug: 'cinema_com_evidencia',
    niche: 'cinema',
    language: 'pt',
    voice: 'clear',
    domain: 'cinema-com-evidencia.fbr.news',
  },
  snapshot: fakeBlogsEditorialSnapshot,
}

// ---------------------------------------------------------------------------
// Blogs side — expected sanitized receipt (metadata only; receiptId/blogId are
// generated at runtime, so the contract test asserts shape, not literals)
// ---------------------------------------------------------------------------

export const expectedReceiptFields = {
  personaId: 'fixture-persona-1',
  personaVersionId: 'fixture-persona-version-3',
  tenantId: 'fixture-tenant-1',
  fluxProjectId: 'fixture-flux-project-1',
  correlationId: 'fixture-corr-1',
  status: 'configured',
  bindingStatus: 'bound',
  eventId: 'fixture-persona-approved-1',
}

/** Keys that must NOT appear anywhere in a sanitized readback (no snapshot body, no secret material). */
export const forbiddenInSanitizedReadback = [
  'snapshot',
  'input',
  'outputs',
  'source_run_ids',
  'token',
  'authorization',
  'api_key',
  'apiKey',
  'secret',
  'password',
]

/** v1 timeout budget: Flux → Authority read-model fetch. */
export const AUTHORITY_READ_MODEL_TIMEOUT_MS = 5_000
/** v1 timeout budget: Flux → Blogs provisioning call. */
export const BLOGS_PROVISIONING_TIMEOUT_MS = 15_000

/** v1 error codes and the HTTP status Blogs must return for each failure class. */
export const v1ErrorCodes = {
  SERVICE_AUTHENTICATION_REQUIRED: 401,
  DUPLICATE_SLUG: 409,
  PERSONA_NOT_APPROVED: 422,
  SNAPSHOT_HASH_MISMATCH: 422,
  APPROVED_VERSION_MISMATCH: 422,
  EXPLICIT_APPROVAL_REQUIRED: 422,
  UNSUPPORTED_CONTRACT_VERSION: 422,
  EVENT_ID_REQUIRED: 422,
  BINDING_PERSISTENCE_NOT_CONFIGURED: 503,
  INVALID_REQUEST: 400,
} as const
