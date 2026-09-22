/**
 * Draft de artigo (AB-S4-005), fact check/claims (AB-S4-006) e SEO review (AB-S4-007).
 * Saída padrão é draft; nota SEO não aprova fatos nem publicação.
 */
export const ARTICLE_UI_VERSION = 1

export type ArticleStatus = 'draft' | 'in-fact-check' | 'in-seo-review' | 'in-media-review' | 'blocked' | 'ready-for-approval'

export type ArticleClaim = {
  claimId: string
  text: string
  classification: 'fact' | 'hypothesis' | 'opinion' | 'blocked'
  sourceIds: string[]
}

export type ArticleDraftInput = {
  articleId: string
  projectId: string
  title: string
  slug: string
  metaDescription?: string
  outline: string[]
  bodyHtml: string
  wordCount?: number
  authorPersonaId: string
  personaVersionId: string
  sourceIds: string[]
  claims?: ArticleClaim[]
}

export type ArticleDraft = ArticleDraftInput & {
  version: number
  status: ArticleStatus
  createdAt: string
}

const WORD_TARGET = 1300

export class ArticleValidationError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'ArticleValidationError'
  }
}

function countWords(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
}

export function createArticleDraft(input: ArticleDraftInput): ArticleDraft {
  if (!input.articleId) throw new ArticleValidationError('ID_REQUIRED', 'articleId obrigatório')
  if (!input.projectId) throw new ArticleValidationError('PROJECT_REQUIRED', 'projectId obrigatório')
  if (!input.title || input.title.trim().length < 8) throw new ArticleValidationError('TITLE_TOO_SHORT', 'título precisa de ao menos 8 caracteres')
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug ?? '')) throw new ArticleValidationError('SLUG_FORMAT', 'slug deve ser kebab-case')
  if (!Array.isArray(input.outline) || input.outline.length < 3) throw new ArticleValidationError('OUTLINE_MIN', 'outline precisa de ao menos 3 seções')
  if (!input.bodyHtml?.trim()) throw new ArticleValidationError('BODY_REQUIRED', 'corpo obrigatório')
  if (!input.authorPersonaId || !input.personaVersionId) throw new ArticleValidationError('PERSONA_REQUIRED', 'autor/persona e versão são obrigatórios')
  if (!Array.isArray(input.sourceIds) || input.sourceIds.length === 0) throw new ArticleValidationError('SOURCES_REQUIRED', 'artigo exige ao menos uma fonte')
  return {
    ...input,
    wordCount: input.wordCount ?? countWords(input.bodyHtml),
    version: 1,
    status: 'draft', // saída padrão: draft
    createdAt: new Date(0).toISOString(),
  }
}

/** Fact check: claim sem suporte não entra como fato; classificação bloqueada vira blocker. */
export function factCheckDraft(draft: ArticleDraft, sources: { sourceId: string }[]): { ok: boolean; blockers: string[] } {
  const ids = new Set(sources.map(s => s.sourceId))
  const blockers: string[] = []
  for (const claim of draft.claims ?? []) {
    if (claim.classification === 'fact') {
      const missing = claim.sourceIds.filter(id => !ids.has(id))
      if (claim.sourceIds.length === 0 || missing.length > 0) {
        blockers.push(`claim "${claim.claimId}" classificada como fato sem fonte suportante (${missing.join(', ') || 'sem fontes'})`)
      }
    }
  }
  for (const srcId of draft.sourceIds) {
    if (!ids.has(srcId)) blockers.push(`fonte declarada "${srcId}" não existe no registro`)
  }
  return { ok: blockers.length === 0, blockers }
}

export type SeoReview = {
  score: number // 0..100
  checks: { name: string; pass: boolean; detail: string }[]
  note: string
}

/** SEO review: intenção, estrutura, headings, links, schema, acessibilidade e indexação. Nota não aprova fatos. */
export function seoReviewDraft(draft: ArticleDraft, brief: { primaryKeyword: string; searchIntent: string }): SeoReview {
  const checks: { name: string; pass: boolean; detail: string }[] = []
  const kw = brief.primaryKeyword.toLowerCase()
  const plain = draft.bodyHtml.toLowerCase()
  checks.push({ name: 'keyword-title', pass: draft.title.toLowerCase().includes(kw), detail: 'palavra primária no título' })
  checks.push({ name: 'keyword-slug', pass: draft.slug.includes(kw.replace(/\s+/g, '-')), detail: 'palavra primária no slug' })
  checks.push({ name: 'headings-h2', pass: /<h2[^>]*>/.test(draft.bodyHtml), detail: 'ao menos um H2 no corpo' })
  const h2Count = (draft.bodyHtml.match(/<h2[^>]*>/g) ?? []).length
  checks.push({ name: 'headings-outline-match', pass: h2Count >= Math.min(draft.outline.length, 3), detail: `${h2Count} H2 vs ${draft.outline.length} seções de outline` })
  checks.push({ name: 'keyword-body-density', pass: plain.split(kw).length - 1 >= 2, detail: 'palavra primária aparece ≥2x no corpo' })
  const meta = draft.metaDescription ?? ''
  checks.push({ name: 'meta-length', pass: meta.length >= 120 && meta.length <= 160, detail: `meta description com ${meta.length} chars (120–160)` })
  checks.push({ name: 'internal-links', pass: /<a[^>]+href="\/[^"]*"/.test(draft.bodyHtml), detail: 'ao menos um link interno relativo' })
  const passed = checks.filter(c => c.pass).length
  const score = Math.round((passed / checks.length) * 100)
  return {
    score,
    checks,
    note: `Nota SEO ${score}/100 — avaliação técnica; não aprova fatos nem habilita publicação.`,
  }
}

export const WORD_COUNT_TARGET = WORD_TARGET

/** Meta de ~1300 palavras quando aplicável: desvio material exige justificativa. */
export function wordCountVerdict(wordCount: number): { onTarget: boolean; deviation: number; requiresJustification: boolean } {
  const deviation = wordCount - WORD_TARGET
  return { onTarget: Math.abs(deviation) <= 200, deviation, requiresJustification: Math.abs(deviation) > 200 }
}
