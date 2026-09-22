/**
 * SPRINT S7 (backend) — Jobs, handoffs versionados e inbox/outbox idempotente.
 *
 * AB-S7-001 jobs rastreáveis (owner, dependência, heartbeat, nextAction, nextCheck);
 * AB-S7-002 handoffs versionados (envio ≠ conclusão);
 * AB-S7-003 inbox/outbox com dedup por event_id+consumer — replay não duplica.
 */
import { computeContentHash, FieldValidator, nowIso, type ValidationResult } from '../contracts/common'

// ---------------------------------------------------------------------------
// AB-S7-001 — jobs
// ---------------------------------------------------------------------------

export type JobKind = 'intake' | 'persona_binding' | 'manifesto' | 'template' | 'editorial' | 'social' | 'provisioning'

export type JobStatus = 'pending' | 'running' | 'waiting_external' | 'blocked' | 'success' | 'failed'

export type AudienceBuilderJob = {
  jobId: string
  projectId: string
  kind: JobKind
  status: JobStatus
  owner: string
  dependsOnJobIds: string[]
  heartbeatAt: string
  nextAction: string
  nextCheckAt: string
  attempts: number
  createdAt: string
  updatedAt: string
}

export function createJob(input: { jobId: string; projectId: string; kind: JobKind; owner: string; dependsOnJobIds?: string[] }, now = nowIso()): AudienceBuilderJob {
  const v = new FieldValidator()
  v.require('jobId', input.jobId)
  v.require('projectId', input.projectId)
  v.enum('kind', input.kind, ['intake', 'persona_binding', 'manifesto', 'template', 'editorial', 'social', 'provisioning'] as const)
  v.require('owner', input.owner)
  if (!v.result().ok) throw new Error(`invalid job: ${JSON.stringify(v.errors)}`)
  return {
    jobId: input.jobId,
    projectId: input.projectId,
    kind: input.kind,
    status: 'pending',
    owner: input.owner,
    dependsOnJobIds: input.dependsOnJobIds ?? [],
    heartbeatAt: now,
    nextAction: 'aguardando início',
    nextCheckAt: now,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function heartbeat(job: AudienceBuilderJob, nextAction: string, nextCheckAt: string, now = nowIso()): AudienceBuilderJob {
  return { ...job, heartbeatAt: now, nextAction, nextCheckAt, updatedAt: now }
}

/** Job não inicia enquanto dependência não tiver sucesso. */
export function canStart(job: AudienceBuilderJob, jobsById: Map<string, AudienceBuilderJob>): boolean {
  return job.dependsOnJobIds.every((id) => jobsById.get(id)?.status === 'success')
}

// ---------------------------------------------------------------------------
// AB-S7-002 — handoffs versionados
// ---------------------------------------------------------------------------

export const HANDOFF_CONTRACT_VERSION = 1

export type VersionedHandoff = {
  handoffId: string
  version: number
  from: string
  to: string
  objective: string
  artifactPath: string
  decisions: string[]
  blockers: string[]
  gate: string | null
  accepted: false | { acceptedBy: string; acceptedAt: string }
  createdAt: string
}

export function createHandoff(input: Omit<VersionedHandoff, 'version' | 'accepted' | 'createdAt'>): VersionedHandoff {
  const v = new FieldValidator()
  v.require('handoffId', input.handoffId)
  v.require('from', input.from)
  v.require('to', input.to)
  v.require('objective', input.objective)
  v.require('artifactPath', input.artifactPath)
  if (!v.result().ok) throw new Error(`invalid handoff: ${JSON.stringify(v.errors)}`)
  // envio não equivale a conclusão: nasce não-aceito
  return { ...input, version: 1, accepted: false, createdAt: nowIso() }
}

/** Aceite registra quem/quando; handoff aceito é imutável (nova versão = novo handoff). */
export function acceptHandoff(h: VersionedHandoff, acceptedBy: string, now = nowIso()): VersionedHandoff {
  if (h.accepted) throw new Error('handoff already accepted — create a new version instead')
  return { ...h, accepted: { acceptedBy, acceptedAt: now } }
}

// ---------------------------------------------------------------------------
// AB-S7-003 — inbox/outbox idempotente
// ---------------------------------------------------------------------------

export type InboxEvent = {
  eventId: string
  consumer: string
  eventType: string
  receivedAt: string
  processedAt: string | null
  status: 'received' | 'processing' | 'success' | 'failed'
  attemptCount: number
  lastError: string | null
  nextRetryAt: string | null
  payloadHash: string
}

export class InboxDeduplicator {
  private readonly seen = new Map<string, InboxEvent>()

  /** Retorna o evento existente (replay) ou registra novo. Nunca duplica. */
  receive(eventId: string, consumer: string, eventType: string, payload: unknown, now = nowIso()): { outcome: 'registered' | 'replay'; event: InboxEvent } {
    const key = `${eventId}::${consumer}`
    const existing = this.seen.get(key)
    if (existing) return { outcome: 'replay', event: existing }
    const event: InboxEvent = {
      eventId,
      consumer,
      eventType,
      receivedAt: now,
      processedAt: null,
      status: 'received',
      attemptCount: 0,
      lastError: null,
      nextRetryAt: null,
      payloadHash: computeContentHash(payload),
    }
    this.seen.set(key, event)
    return { outcome: 'registered', event }
  }

  markProcessing(eventId: string, consumer: string, now = nowIso()): InboxEvent | undefined {
    const ev = this.seen.get(`${eventId}::${consumer}`)
    if (!ev) return undefined
    ev.status = 'processing'
    ev.attemptCount += 1
    ev.processedAt = null
    void now
    return { ...ev }
  }

  markSuccess(eventId: string, consumer: string, now = nowIso()): InboxEvent | undefined {
    const ev = this.seen.get(`${eventId}::${consumer}`)
    if (!ev) return undefined
    ev.status = 'success'
    ev.processedAt = now
    ev.lastError = null
    ev.nextRetryAt = null
    return { ...ev }
  }

  markFailed(eventId: string, consumer: string, error: string, nextRetryAt: string): InboxEvent | undefined {
    const ev = this.seen.get(`${eventId}::${consumer}`)
    if (!ev) return undefined
    ev.status = 'failed'
    ev.lastError = error
    ev.nextRetryAt = nextRetryAt
    return { ...ev }
  }

  get(eventId: string, consumer: string): InboxEvent | undefined {
    const ev = this.seen.get(`${eventId}::${consumer}`)
    return ev ? { ...ev } : undefined
  }
}

/** Replay seguro: binding/job/provisioning só executam em 'registered'. */
export function processOnce<T>(inbox: InboxDeduplicator, eventId: string, consumer: string, eventType: string, payload: unknown, effect: () => T, now = nowIso()): { outcome: 'executed' | 'skipped_replay'; result?: T } {
  const received = inbox.receive(eventId, consumer, eventType, payload, now)
  if (received.outcome === 'replay') {
    const current = inbox.get(eventId, consumer)
    if (current?.status === 'success') return { outcome: 'skipped_replay' }
  }
  inbox.markProcessing(eventId, consumer, now)
  try {
    const result = effect()
    inbox.markSuccess(eventId, consumer, now)
    return { outcome: 'executed', result }
  } catch (err) {
    const retry = new Date(Date.parse(now) + 60_000).toISOString()
    inbox.markFailed(eventId, consumer, err instanceof Error ? err.message : String(err), retry)
    throw err
  }
}
