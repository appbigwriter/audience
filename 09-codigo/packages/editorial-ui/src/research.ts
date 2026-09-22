/**
 * Briefing de pesquisa (AB-S4-003) e registro de fontes/citações (AB-S4-004).
 * Briefing registra intenção, palavra primária, termos secundários, público, 4 pontos, limitações e fontes.
 * Fonte ausente bloqueia claim dependente.
 */
export const RESEARCH_UI_VERSION = 1

export type ResearchBrief = {
  briefId: string
  projectId: string
  primaryKeyword: string
  secondaryTerms: string[]
  searchIntent: 'informational' | 'comparative' | 'transactional' | 'navigational'
  audience: string
  outlinePoints: string[] // mínimo 4
  limitations: string[]
  sourceIds: string[]
  createdAt: string
}

export type BriefValidationError = { path: string; code: string; message: string }

export function validateResearchBrief(brief: ResearchBrief): { ok: boolean; errors: BriefValidationError[] } {
  const errors: BriefValidationError[] = []
  if (!brief.briefId?.trim()) errors.push({ path: 'briefId', code: 'ID_REQUIRED', message: 'briefId obrigatório' })
  if (!brief.projectId?.trim()) errors.push({ path: 'projectId', code: 'PROJECT_REQUIRED', message: 'projectId obrigatório' })
  if (!brief.primaryKeyword?.trim()) errors.push({ path: 'primaryKeyword', code: 'KEYWORD_REQUIRED', message: 'palavra primária obrigatória' })
  if (!['informational', 'comparative', 'transactional', 'navigational'].includes(brief.searchIntent)) {
    errors.push({ path: 'searchIntent', code: 'ENUM', message: 'searchIntent inválido' })
  }
  if (!brief.audience?.trim()) errors.push({ path: 'audience', code: 'AUDIENCE_REQUIRED', message: 'público obrigatório' })
  if (!Array.isArray(brief.outlinePoints) || brief.outlinePoints.length < 4) {
    errors.push({ path: 'outlinePoints', code: 'MIN_POINTS', message: 'pauta precisa de pelo menos 4 pontos concretos' })
  }
  if (!Array.isArray(brief.limitations)) errors.push({ path: 'limitations', code: 'ARRAY', message: 'limitações devem ser lista' })
  if (!Array.isArray(brief.sourceIds)) errors.push({ path: 'sourceIds', code: 'ARRAY', message: 'fontes devem ser lista' })
  return { ok: errors.length === 0, errors }
}

export type SourceType = 'official' | 'news' | 'academic' | 'industry-report' | 'company-data' | 'forum-community' | 'other'

export type SourceRecord = {
  sourceId: string
  url: string
  title: string
  origin: string
  accessedAt: string // ISO date
  type: SourceType
  excerpt?: string
  relatedClaims?: string[]
  limitations?: string
}

export function validateSourceRecord(src: SourceRecord): { ok: boolean; errors: BriefValidationError[] } {
  const errors: BriefValidationError[] = []
  if (!src.sourceId?.trim()) errors.push({ path: 'sourceId', code: 'ID_REQUIRED', message: 'sourceId obrigatório' })
  if (!/^https?:\/\/.+/.test(src.url ?? '')) errors.push({ path: 'url', code: 'URL_REQUIRED', message: 'URL http(s) obrigatória' })
  if (!src.title?.trim()) errors.push({ path: 'title', code: 'TITLE_REQUIRED', message: 'título obrigatório' })
  if (!src.origin?.trim()) errors.push({ path: 'origin', code: 'ORIGIN_REQUIRED', message: 'origem obrigatória' })
  if (!/^\d{4}-\d{2}-\d{2}/.test(src.accessedAt ?? '')) errors.push({ path: 'accessedAt', code: 'DATE_FORMAT', message: 'data de acesso ISO obrigatória' })
  const validTypes: SourceType[] = ['official', 'news', 'academic', 'industry-report', 'company-data', 'forum-community', 'other']
  if (!validTypes.includes(src.type)) errors.push({ path: 'type', code: 'ENUM', message: 'tipo de fonte inválido' })
  return { ok: errors.length === 0, errors }
}

/**
 * Claim depende de fonte: claim sem suporte não entra como fato (AB-S4-006 gateway; AB-S4-004 bloqueio).
 */
export function checkClaimSupport(claim: { text: string; sourceIds: string[] }, sources: SourceRecord[]): { supported: boolean; missing: string[] } {
  const ids = new Set(sources.map(s => s.sourceId))
  const missing = claim.sourceIds.filter(id => !ids.has(id))
  return { supported: missing.length === 0, missing }
}
