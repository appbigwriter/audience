export type ChannelPlan = {
  objective: string; audience: string[]; formats: string[]; cadence: string; pillars: string[]; disclosure: string; constraints: string[]; plan?: string
}
export type PlannedChannel = ChannelPlan & { versionId: string; status: 'planned' | 'configured' }
export type PersonaEditorialSnapshot = {
  snapshotHash: string; personaName: string; bio: string; positioning: string; centralPromise: string; audience: string[]
  voice: string; vocabulary: string[]; editorialPillars: string[]; priorityTopics: string[]; prohibitedTopics: string[]
  guardrails: string[]; qualityCriteria: string[]; reviewCriteria: string[]; blogChannelPlan: ChannelPlan
  socialChannelPlan: PlannedChannel; youtubeChannelPlan: PlannedChannel
}
export type AuthorityPersonaBindingInput = {
  contractVersion: number; idempotencyKey: string; eventId: string; tenantId: string; fluxProjectId: string
  correlationId: string; causationId: string | null; sourceEventId: string; authorityProjectId: string
  personaId: string; personaVersionId: string; personaVersion: number; personaStatus: 'approved' | 'pending' | 'rejected' | 'archived'
  personaSnapshotHash: string; personaApprovalId: string; approvedBy: string; approvedAt: string; approvalScope: string; approvedVersions: string[]
  blog: { name: string; slug: string; niche: string; language: string; voice: string; domain?: string | null }
  snapshot: PersonaEditorialSnapshot
}
export type PersonaBindingRecord = { id: string; blogId: string; input: AuthorityPersonaBindingInput; status: 'bound'; boundAt: string }
export type EditorialConfigRecord = { blogId: string; personaId: string; personaVersionId: string; snapshotHash: string; blogChannelPlan: ChannelPlan; pillars: string[]; priorityTopics: string[]; prohibitedTopics: string[]; socialChannelPlan: PlannedChannel; youtubeChannelPlan: PlannedChannel }
export type PersonaBindingReceipt = { receiptId: string; blogId: string; personaId: string; personaVersionId: string; tenantId: string; fluxProjectId: string; correlationId: string; status: 'configured'; bindingStatus: 'bound'; eventId: string }

/**
 * Typed v1 adapter-contract error. Carries a stable machine-readable `code`
 * and the HTTP status the service boundary must return, so Flux can branch
 * deterministically instead of parsing message strings.
 * See `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`.
 */
export class PersonaBindingContractError extends Error {
  constructor(readonly code: string, message: string, readonly httpStatus: number) {
    super(message)
    this.name = 'PersonaBindingContractError'
  }
}

export function validateAuthorityPersonaBinding(input: AuthorityPersonaBindingInput) {
  if (input.contractVersion !== 1) throw new PersonaBindingContractError('UNSUPPORTED_CONTRACT_VERSION', 'unsupported contract version', 422)
  if (!input.eventId || !input.idempotencyKey) throw new PersonaBindingContractError('EVENT_ID_REQUIRED', 'event id and idempotency key are required', 422)
  if (input.personaStatus !== 'approved') throw new PersonaBindingContractError('PERSONA_NOT_APPROVED', 'persona must be approved', 422)
  if (!input.approvedBy || !input.personaApprovalId || !input.approvedAt) throw new PersonaBindingContractError('EXPLICIT_APPROVAL_REQUIRED', 'explicit persona approval is required', 422)
  if (!input.approvedVersions.includes(input.personaVersionId)) throw new PersonaBindingContractError('APPROVED_VERSION_MISMATCH', 'approved persona version mismatch', 422)
  if (input.personaSnapshotHash !== input.snapshot.snapshotHash) throw new PersonaBindingContractError('SNAPSHOT_HASH_MISMATCH', 'persona snapshot hash mismatch', 422)
}
