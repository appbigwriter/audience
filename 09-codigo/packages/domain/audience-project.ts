/**
 * AB-S2-001 — Domínio Audience Project.
 *
 * Modelo que conecta Persona, blog, canais, template, editorial e monetização.
 * - criação exige Persona validada (gate de elegibilidade);
 * - duplicidade por slug/owner é controlada;
 * - transições testadas via contrato de estados (AB-S1-005).
 */
import { computeContentHash, nowIso } from '../contracts/common'
import { assertTransition, buildTransitionRecord, type AudienceProjectState, type AudienceProjectTransitionRecord } from '../contracts/audience-project-states'
import { decidePersonaEligibility, compareAgainstBinding, type PersonaIntakePackage } from '../contracts/persona-intake'
import { evaluateReleaseGate } from '../contracts/release-gate'
import type { PersistenceReadbackCapability } from '../contracts/persistence-contract'

export type AudienceProject = {
  id: string
  name: string
  slug: string
  ownerId: string
  tenantId: string
  status: AudienceProjectState
  niche: string
  audienceDefinition: string
  businessObjective: string
  language: string
  region: string
  /** Versão do projeto (incrementa em mudanças estruturais). */
  version: number
  personaBinding: PersonaBinding | null
  createdAt: string
  updatedAt: string
  transitions: AudienceProjectTransitionRecord[]
}

/** AB-S2-003 — binding imutável entre projeto e snapshot aprovado. */
export type PersonaBinding = {
  personaId: string
  personaVersionId: string
  personaVersion: number
  contentHash: string
  approvedBy: string
  approvedAt: string
  boundAt: string
  boundBy: string
}

export type CreateAudienceProjectInput = {
  id?: string
  name: string
  slug: string
  ownerId: string
  tenantId: string
  niche: string
  audienceDefinition: string
  businessObjective: string
  language: string
  region: string
}

export type PersonaBindingOutcome =
  | { outcome: 'bound'; binding: PersonaBinding }
  | { outcome: 'replay'; binding: PersonaBinding }
  | { outcome: 'divergent'; reason: string }
  | { outcome: 'stale_version'; reason: string }
  | { outcome: 'rejected'; reason: string }

export class AudienceProjectDomainError extends Error {
  constructor(readonly code: string, message: string, readonly details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AudienceProjectDomainError'
  }
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateSlug(slug: string): boolean {
  return typeof slug === 'string' && SLUG_RE.test(slug) && slug.length >= 3 && slug.length <= 64
}

/**
 * Cria um Audience Project. Exige Persona aprovada e gate liberado para o
 * alvo informado. O projeto nasce em `draft` — nada é provisionado aqui.
 */
export function createAudienceProject(
  input: CreateAudienceProjectInput,
  personaPackage: PersonaIntakePackage,
  persistence: PersistenceReadbackCapability,
  opts: { target?: 'local' | 'production'; idFactory?: () => string; now?: () => string } = {},
): AudienceProject {
  const target = opts.target ?? 'local'
  if (!validateSlug(input.slug)) {
    throw new AudienceProjectDomainError('INVALID_SLUG', 'slug must be lowercase-hyphen, 3-64 chars', { slug: input.slug })
  }
  for (const field of ['name', 'ownerId', 'tenantId', 'niche', 'audienceDefinition', 'businessObjective', 'language', 'region'] as const) {
    if (!input[field] || String(input[field]).trim().length === 0) {
      throw new AudienceProjectDomainError('REQUIRED_FIELD', `${field} is required`, { field })
    }
  }
  const gate = evaluateReleaseGate({ target, personaPackage, persistence })
  if (!gate.released) {
    throw new AudienceProjectDomainError('RELEASE_GATE_BLOCKED', 'release gate blocked project creation', {
      blockers: gate.blockers.map((b) => b.check),
    })
  }
  const eligibility = decidePersonaEligibility(personaPackage)
  if (!eligibility.eligible) {
    throw new AudienceProjectDomainError('PERSONA_NOT_ELIGIBLE', 'persona is not eligible for binding', {
      code: eligibility.reason?.code,
    })
  }
  const now = opts.now?.() ?? nowIso()
  return {
    id: input.id ?? opts.idFactory?.() ?? `ap-${computeContentHash({ slug: input.slug, ownerId: input.ownerId }).slice(7, 19)}`,
    name: input.name,
    slug: input.slug,
    ownerId: input.ownerId,
    tenantId: input.tenantId,
    status: 'draft',
    niche: input.niche,
    audienceDefinition: input.audienceDefinition,
    businessObjective: input.businessObjective,
    language: input.language,
    region: input.region,
    version: 1,
    personaBinding: null,
    createdAt: now,
    updatedAt: now,
    transitions: [],
  }
}

/**
 * AB-S2-003 — associa Persona aprovada ao projeto.
 * - grava persona_id, versão e hash (readback é responsabilidade do repo);
 * - versão stale é rejeitada (novo binding exige nova aprovação);
 * - mesma versão+hash é idempotente (`replay`).
 */
export function bindPersona(
  project: AudienceProject,
  pkg: PersonaIntakePackage,
  actor: string,
  opts: { now?: () => string } = {},
): PersonaBindingOutcome {
  const eligibility = decidePersonaEligibility(pkg)
  if (!eligibility.eligible) {
    return { outcome: 'rejected', reason: eligibility.reason?.code ?? 'PERSONA_NOT_ELIGIBLE' }
  }
  // AB-S0-002: hash declarado deve cobrir o conteúdo real do snapshot.
  // Recalcular impede pacote adulterado com hash antigo.
  const actualHash = computeContentHash(pkg.snapshot)
  if (actualHash !== pkg.contentHash) {
    return { outcome: 'divergent', reason: 'SNAPSHOT_HASH_DIVERGENT' }
  }
  const current = project.personaBinding
  const comparison = compareAgainstBinding(pkg, current)
  if (comparison.outcome === 'replay') return { outcome: 'replay', binding: current! }
  if (comparison.outcome === 'divergent') return { outcome: 'divergent', reason: 'SNAPSHOT_HASH_DIVERGENT' }
  if (comparison.outcome === 'stale_version') return { outcome: 'stale_version', reason: 'PERSONA_VERSION_SUPERSEDED' }
  const now = opts.now?.() ?? nowIso()
  const binding: PersonaBinding = {
    personaId: pkg.personaId,
    personaVersionId: pkg.personaVersionId,
    personaVersion: pkg.personaVersion,
    contentHash: pkg.contentHash,
    approvedBy: pkg.approval.approvedBy,
    approvedAt: pkg.approval.approvedAt,
    boundAt: now,
    boundBy: actor,
  }
  project.personaBinding = binding
  project.updatedAt = now
  return { outcome: 'bound', binding }
}

/** Transição de estado com evidência (actor/timestamp/reason) e registro histórico. */
export function transitionProject(project: AudienceProject, to: AudienceProjectState, ref: { actor: string; reason: string; now?: () => string }): void {
  const record = buildTransitionRecord(project.status, to, { actor: ref.actor, reason: ref.reason, at: '' })
  const at = ref.now?.() ?? nowIso()
  record.at = at
  project.transitions.push(record)
  project.status = to
  project.updatedAt = at
}

/** Duplicidade controlada: mesmo owner + slug = mesmo projeto lógico. */
export function isDuplicateProject(a: { ownerId: string; slug: string }, b: { ownerId: string; slug: string }): boolean {
  return a.ownerId === b.ownerId && a.slug === b.slug
}

/**
 * Checagem auxiliar: `active` nunca publica. Publicação exige Gate externo
 * registrado fora do domínio (Sprint S8/G6). Esta função existe para que
 * testes e revisores assertem a invariant.
 */
export function publicationRequiresExternalGate(project: AudienceProject): { publicationAllowed: false; gate: 'sergio-approval' } {
  void project
  return { publicationAllowed: false, gate: 'sergio-approval' }
}
