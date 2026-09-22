/**
 * AB-S1-005 — Contrato de estados do Audience Project.
 *
 * Estados exigidos: draft, intake, persona_bound, planning, provisioning,
 * active, paused, blocked, archived.
 *
 * Regras:
 * - transições inválidas falham com erro estruturado;
 * - cada transição registra actor, timestamp e motivo;
 * - publicação NÃO é consequência automática de `active`.
 */
import { AudienceBuilderContractError, type ActorRef } from './common'

export const AUDIENCE_PROJECT_STATES = [
  'draft',
  'intake',
  'persona_bound',
  'planning',
  'provisioning',
  'active',
  'paused',
  'blocked',
  'archived',
] as const

export type AudienceProjectState = (typeof AUDIENCE_PROJECT_STATES)[number]

/**
 * Transições permitidas. Publicação é sempre evento de Gate externo,
 * portanto não existe transição automática para qualquer estado "published".
 */
const TRANSITIONS: Record<AudienceProjectState, readonly AudienceProjectState[]> = {
  draft: ['intake', 'archived'],
  intake: ['persona_bound', 'blocked', 'archived'],
  persona_bound: ['planning', 'blocked', 'archived'],
  planning: ['provisioning', 'blocked', 'archived'],
  provisioning: ['active', 'blocked', 'archived'],
  active: ['paused', 'blocked', 'archived'],
  paused: ['active', 'blocked', 'archived'],
  blocked: ['planning', 'archived'], // desbloqueio volta a planning; nunca direto a active
  archived: [],
}

export type AudienceProjectTransitionRecord = {
  from: AudienceProjectState
  to: AudienceProjectState
  actor: string
  at: string
  reason: string
}

export function canTransition(from: AudienceProjectState, to: AudienceProjectState): boolean {
  const allowed = TRANSITIONS[from]
  if (!allowed) throw new AudienceBuilderContractError('UNKNOWN_STATE', `unknown state: ${from}`, 422)
  return allowed.includes(to)
}

export function assertTransition(from: AudienceProjectState, to: AudienceProjectState): void {
  if (!canTransition(from, to)) {
    throw new AudienceBuilderContractError(
      'INVALID_TRANSITION',
      `transition ${from} -> ${to} is not allowed`,
      422,
      { from, to, allowed: TRANSITIONS[from] },
    )
  }
}

export function buildTransitionRecord(from: AudienceProjectState, to: AudienceProjectState, ref: ActorRef): AudienceProjectTransitionRecord {
  assertTransition(from, to)
  if (!ref.actor || !ref.reason) {
    throw new AudienceBuilderContractError('TRANSITION_EVIDENCE_REQUIRED', 'actor and reason are required for transitions', 422)
  }
  return { from, to, actor: ref.actor, at: ref.at, reason: ref.reason }
}

/** Saídas permitidas por estado (para documentação/testes). */
export function allowedTransitionsFrom(state: AudienceProjectState): readonly AudienceProjectState[] {
  return TRANSITIONS[state]
}
