/**
 * SPRINT S4 (backend) — Editorial Engine: perfil derivado, briefing, fontes,
 * draft, fact check.
 *
 * AB-S4-001 perfil editorial derivado da Persona (ajustes só dentro do escopo);
 * AB-S4-003 briefing de pesquisa (intenção, palavra, 4 pontos, limitações, fontes);
 * AB-S4-004 registro de fontes (fonte ausente bloqueia claim dependente);
 * AB-S4-005 draft de artigo (versão, status, saída padrão draft);
 * AB-S4-006 fact check (claim sem suporte não entra como fato).
 */
import { FieldValidator, type ValidationResult } from '../contracts/common'
import type { PersonaIntakePackage } from '../contracts/persona-intake'

// ---------------------------------------------------------------------------
// AB-S4-001 — perfil editorial derivado
// ---------------------------------------------------------------------------

export type DerivedEditorialProfile = {
  projectId: string
  personaVersionId: string
  voice: string
  vocabulary: string[]
  pillars: string[]
  formats: string[]
  cadence: string
  guardrails: string[]
  prohibitedTopics: string[]
  language: string
  disclosureTemplate: string
}

export type EditorialAdjustment = {
  field: 'vocabulary' | 'formats' | 'cadence'
  add?: string[]
  remove?: string[]
}

/** Ajustes permitidos: vocabulary/formats/cadence. Voz, pilares, guardrails e tópicos proibidos NÃO são ajustáveis aqui. */
export function deriveEditorialProfile(pkg: PersonaIntakePackage, projectId: string, language: string, adjustments: EditorialAdjustment[] = []): DerivedEditorialProfile {
  const blogPlan = pkg.snapshot.channelPlans.blog
  let vocabulary = [...pkg.snapshot.editorialProfile.vocabulary]
  let formats = [...blogPlan.formats]
  let cadence = blogPlan.cadence
  for (const adj of adjustments) {
    if (adj.add) {
      if (adj.field === 'vocabulary') vocabulary = [...vocabulary, ...adj.add]
      if (adj.field === 'formats') formats = [...formats, ...adj.add]
    }
    if (adj.remove) {
      if (adj.field === 'vocabulary') vocabulary = vocabulary.filter((v) => !adj.remove!.includes(v))
      if (adj.field === 'formats') formats = formats.filter((f) => !adj.remove!.includes(f))
    }
    if (adj.field === 'cadence' && adj.add?.[0]) cadence = adj.add[0]
  }
  return {
    projectId,
    personaVersionId: pkg.personaVersionId,
    voice: pkg.snapshot.editorialProfile.voice, // não ajustável
    vocabulary,
    pillars: [...pkg.snapshot.editorialProfile.editorialPillars], // não ajustável
    formats,
    cadence,
    guardrails: [...pkg.snapshot.editorialProfile.guardrails], // não ajustável
    prohibitedTopics: [...pkg.snapshot.editorialProfile.prohibitedTopics], // não ajustável
    language,
    disclosureTemplate: pkg.snapshot.disclosurePolicy.affiliateDisclosureTemplate,
  }
}

// ---------------------------------------------------------------------------
// AB-S4-003 — briefing de pesquisa
// ---------------------------------------------------------------------------

export type ResearchBrief = {
  id: string
  projectId: string
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
  primaryKeyword: string
  secondaryTerms: string[]
  audience: string
  /** mínimo 4 pontos concretos */
  keyPoints: string[]
  limitations: string[]
  sourceIds: string[]
  createdAt: string
}

export function validateResearchBrief(b: Partial<ResearchBrief> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!b) { v.add('brief', 'REQUIRED', 'brief is required'); return v.result() }
  v.require('id', b.id)
  v.require('projectId', b.projectId)
  v.enum('intent', b.intent, ['informational', 'commercial', 'transactional', 'navigational'] as const)
  v.require('primaryKeyword', b.primaryKeyword)
  v.requireNonEmptyArray('secondaryTerms', b.secondaryTerms)
  v.require('audience', b.audience)
  if (!Array.isArray(b.keyPoints) || b.keyPoints.length < 4) v.add('keyPoints', 'MIN_FOUR_POINTS', 'pauta exige pelo menos quatro pontos concretos')
  v.requireNonEmptyArray('limitations', b.limitations)
  v.requireNonEmptyArray('sourceIds', b.sourceIds)
  return v.result()
}

// ---------------------------------------------------------------------------
// AB-S4-004 — registro de fontes
// ---------------------------------------------------------------------------

export type SourceType = 'primary' | 'news' | 'academic' | 'official' | 'statistics' | 'other'

export type RegisteredSource = {
  id: string
  url: string
  title: string
  origin: string
  accessedAt: string
  type: SourceType
  /** trecho/claim relacionado que a fonte sustenta */
  supportsClaim: string
  limitation?: string
}

export function validateSource(s: Partial<RegisteredSource> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!s) { v.add('source', 'REQUIRED', 'source is required'); return v.result() }
  v.require('id', s.id)
  if (!s.url || !/^https?:\/\/.+/.test(s.url)) v.add('url', 'INVALID_URL', 'url must be http(s)')
  v.require('title', s.title)
  v.require('origin', s.origin)
  if (!s.accessedAt || Number.isNaN(new Date(s.accessedAt).getTime())) v.add('accessedAt', 'INVALID_DATE', 'accessedAt must be ISO-8601')
  v.enum('type', s.type, ['primary', 'news', 'academic', 'official', 'statistics', 'other'] as const)
  v.require('supportsClaim', s.supportsClaim)
  return v.result()
}

// ---------------------------------------------------------------------------
// AB-S4-006 — fact check e claims
// ---------------------------------------------------------------------------

export type ClaimClassification = 'fact' | 'hypothesis' | 'opinion' | 'blocked'

export type CheckedClaim = {
  text: string
  classification: ClaimClassification
  sourceIds: string[]
}

/**
 * Regra central: claim classificado como `fact` EXIGE pelo menos uma fonte
 * registrada; caso contrário é rebaixado/bloqueado — nunca entra como fato.
 */
export function factCheck(claims: Array<Partial<CheckedClaim>>, knownSourceIds: Set<string>): Array<{ claim: CheckedClaim; adjusted: boolean }> {
  return claims.map((c) => {
    const sourceIds = (c.sourceIds ?? []).filter((id) => knownSourceIds.has(id))
    const validSources = (c.sourceIds ?? []).length === sourceIds.length && sourceIds.length > 0
    if (c.classification === 'fact' && !validSources) {
      return { claim: { text: c.text ?? '', classification: 'blocked', sourceIds }, adjusted: true }
    }
    return { claim: { text: c.text ?? '', classification: c.classification ?? 'opinion', sourceIds: sourceIds.length ? sourceIds : (c.sourceIds ?? []) }, adjusted: false }
  })
}

// ---------------------------------------------------------------------------
// AB-S4-005 — draft de artigo
// ---------------------------------------------------------------------------

export type ArticleDraftStatus = 'draft' | 'in_review' | 'fact_checked' | 'seo_reviewed' | 'blocked' | 'approved_draft'

export type ArticleDraft = {
  id: string
  projectId: string
  version: number
  status: ArticleDraftStatus
  title: string
  slug: string
  metaDescription: string
  outline: string[]
  body: string
  wordCount: number
  authorPersonaVersionId: string
  sourceIds: string[]
  claims: CheckedClaim[]
  createdAt: string
  updatedAt: string
}

export type CreateDraftInput = Omit<ArticleDraft, 'version' | 'status' | 'wordCount' | 'createdAt' | 'updatedAt'>

export function createArticleDraft(input: CreateDraftInput, now: string): ArticleDraft {
  const v = new FieldValidator()
  v.require('id', input.id)
  v.require('projectId', input.projectId)
  v.require('title', input.title)
  if (!input.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) v.add('slug', 'INVALID_SLUG', 'slug must be lowercase-hyphen')
  v.require('metaDescription', input.metaDescription)
  v.requireNonEmptyArray('outline', input.outline)
  v.require('body', input.body)
  v.require('authorPersonaVersionId', input.authorPersonaVersionId)
  const res = v.result()
  if (!res.ok) throw new Error(`invalid draft: ${JSON.stringify(res.errors)}`)
  return {
    ...input,
    version: 1,
    status: 'draft', // saída padrão é draft — nunca publicado por aqui
    wordCount: input.body.split(/\s+/).filter(Boolean).length,
    createdAt: now,
    updatedAt: now,
  }
}

/** Nova versão somente por revisão explícita; histórico preservado pelo chamador. */
export function reviseDraft(draft: ArticleDraft, patch: Partial<Pick<ArticleDraft, 'title' | 'body' | 'outline' | 'metaDescription' | 'claims' | 'sourceIds'>>, now: string): ArticleDraft {
  const next: ArticleDraft = { ...draft, ...patch, version: draft.version + 1, updatedAt: now }
  if (patch.body !== undefined) next.wordCount = patch.body.split(/\s+/).filter(Boolean).length
  // revisão volta para draft (recomeça o ciclo de checagem)
  next.status = 'draft'
  return next
}

/** Draft só vira `approved_draft` com todos os claims fatuais sustentados. */
export function approveDraftIfSupported(draft: ArticleDraft): { approved: boolean; reason?: string } {
  const pendingFact = draft.claims.find((c) => c.classification === 'fact' && c.sourceIds.length === 0)
  if (pendingFact) return { approved: false, reason: 'UNSUPPORTED_FACT_CLAIM' }
  if (draft.claims.some((c) => c.classification === 'blocked')) return { approved: false, reason: 'BLOCKED_CLAIM_PRESENT' }
  if (draft.sourceIds.length === 0) return { approved: false, reason: 'NO_SOURCES' }
  return { approved: true }
}
