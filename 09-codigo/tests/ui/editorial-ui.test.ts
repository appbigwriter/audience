/**
 * Track B — AB-S4-001..009: perfil editorial derivado, calendário, briefing/fontes, draft/fact-check/SEO, mídia.
 */
import { describe, expect, it } from 'vitest'
import { deriveEditorialProfile, EDITORIAL_OVERRIDE_ALLOWLIST, type PersonaEditorialSource } from '../../packages/editorial-ui/src/editorial-profile'
import {
  CalendarError, assertNoAutoPublish, calendarView, createCalendarItem, transitionCalendarItem,
  type CalendarItem,
} from '../../packages/editorial-ui/src/calendar'
import { checkClaimSupport, validateResearchBrief, validateSourceRecord, type ResearchBrief, type SourceRecord } from '../../packages/editorial-ui/src/research'
import {
  ArticleValidationError, WORD_COUNT_TARGET, createArticleDraft, factCheckDraft, seoReviewDraft, wordCountVerdict,
} from '../../packages/editorial-ui/src/article'
import { checkAssetRights, mediaQa, validateAsset, type MediaAsset } from '../../packages/editorial-ui/src/media'

const personaSource: PersonaEditorialSource = {
  personaId: 'persona-1', personaVersionId: 'pv-1', contentHash: 'hash-abc',
  tone: ['próximo', 'didático'], pillars: ['guias', 'análises'], formats: ['guia', 'comparativo'],
  frequencyPerWeek: 3, guardrails: ['sem promessa sem fonte'], language: 'pt-BR',
  disclosureTemplate: 'Contém links de afiliado.', forbiddenClaims: ['cura'],
}

describe('AB-S4-001 Perfil editorial derivado', () => {
  it('deriva perfil da Persona com binding imutável referenciado', () => {
    const r = deriveEditorialProfile(personaSource)
    expect(r.ok).toBe(true)
    expect(r.profile!.source.personaId).toBe('persona-1')
    expect(r.profile!.source.contentHash).toBe('hash-abc')
    expect(r.profile!.scopeAllowed).toEqual(EDITORIAL_OVERRIDE_ALLOWLIST)
  })

  it('overrides dentro do escopo aplicam; fora do escopo rejeitam', () => {
    const ok = deriveEditorialProfile(personaSource, { frequencyPerWeek: 5 })
    expect(ok.ok).toBe(true)
    expect(ok.profile!.source.frequencyPerWeek).toBe(5)
    const bad = deriveEditorialProfile(personaSource, { pillars: ['novo-pilar'] })
    expect(bad.ok).toBe(false)
    expect(bad.errors[0]).toContain('fora do escopo')
  })

  it('valida tipos e ranges dos overrides', () => {
    expect(deriveEditorialProfile(personaSource, { frequencyPerWeek: 99 }).ok).toBe(false)
    expect(deriveEditorialProfile(personaSource, { formats: 'guia' as never }).ok).toBe(false)
    expect(deriveEditorialProfile(personaSource, { tone: [] }).ok).toBe(false)
  })

  it('sem binding de Persona rejeita (personaId/versão/hash obrigatórios)', () => {
    const r = deriveEditorialProfile({ ...personaSource, personaVersionId: '' })
    expect(r.ok).toBe(false)
  })
})

describe('AB-S4-002 Calendário editorial', () => {
  const base = {
    itemId: 'cal-1', projectId: 'ap-1', title: 'Guia de X para iniciantes',
    scheduledFor: '2026-10-01', owner: 'gestor-editorial', channel: 'blog' as const,
  }

  it('cria item com defaults e exige pauta mínima de 4 pontos', () => {
    const item = createCalendarItem(base)
    expect(item.status).toBe('idea')
    expect(item.priority).toBe('normal')
    expect(() => createCalendarItem({ ...base, outlinePoints: ['p1', 'p2', 'p3'] })).toThrow(CalendarError)
    expect(() => createCalendarItem({ ...base, outlinePoints: ['p1', 'p2', 'p3', 'p4'] })).not.toThrow()
  })

  it('valida formato de data e obrigatoriedade', () => {
    expect(() => createCalendarItem({ ...base, scheduledFor: 'amanhã' })).toThrow(/data ISO/)
    expect(() => createCalendarItem({ ...base, owner: '' })).toThrow(CalendarError)
  })

  it('transições inválidas falham; blocked exige motivo', () => {
    let item = createCalendarItem(base)
    expect(() => transitionCalendarItem(item, 'approved-draft')).toThrow(/não permitida/)
    item = transitionCalendarItem(item, 'briefed')
    item = transitionCalendarItem(item, 'in-research')
    item = transitionCalendarItem(item, 'blocked', { reason: 'sem fonte' })
    expect(item.blockedReason).toBe('sem fonte')
    let researchable = transitionCalendarItem(createCalendarItem(base), 'briefed')
    researchable = transitionCalendarItem(researchable, 'in-research')
    expect(() => transitionCalendarItem(researchable, 'blocked', {})).toThrow(/motivo/)
  })

  it('approved-draft é terminal no calendário; nenhuma publicação automática', () => {
    let item = createCalendarItem(base)
    item = transitionCalendarItem(item, 'briefed')
    item = transitionCalendarItem(item, 'in-research')
    item = transitionCalendarItem(item, 'drafting')
    item = transitionCalendarItem(item, 'in-review')
    item = transitionCalendarItem(item, 'approved-draft')
    expect(item.status).toBe('approved-draft')
    expect(() => transitionCalendarItem(item, 'in-review')).toThrow()
    expect(assertNoAutoPublish(item)).toBeUndefined()
  })

  it('calendarView filtra por projeto/canal/período e ordena', () => {
    const items: CalendarItem[] = [
      createCalendarItem({ ...base, itemId: 'a', scheduledFor: '2026-10-05' }),
      createCalendarItem({ ...base, itemId: 'b', scheduledFor: '2026-10-01', channel: 'social' }),
      createCalendarItem({ ...base, itemId: 'c', scheduledFor: '2026-10-03', projectId: 'ap-2' }),
    ]
    const view = calendarView(items, { projectId: 'ap-1' })
    expect(view.map(i => i.itemId)).toEqual(['b', 'a'])
    expect(calendarView(items, { channel: 'social' }).map(i => i.itemId)).toEqual(['b'])
    expect(calendarView(items, { from: '2026-10-02', to: '2026-10-04' }).map(i => i.itemId)).toEqual(['c'])
  })
})

const brief: ResearchBrief = {
  briefId: 'b-1', projectId: 'ap-1', primaryKeyword: 'melhor faca de chef',
  secondaryTerms: ['faca japonesa'], searchIntent: 'comparative', audience: 'cozinheiros amadores',
  outlinePoints: ['p1', 'p2', 'p3', 'p4'], limitations: ['dados de 2026'], sourceIds: ['s-1'], createdAt: '2026-09-22',
}

describe('AB-S4-003 Briefing de pesquisa', () => {
  it('briefing válido passa; menos de 4 pontos falha', () => {
    expect(validateResearchBrief(brief).ok).toBe(true)
    const bad = validateResearchBrief({ ...brief, outlinePoints: ['p1'] })
    expect(bad.ok).toBe(false)
    expect(bad.errors.find(e => e.code === 'MIN_POINTS')).toBeTruthy()
  })

  it('exige intenção, palavra primária e público', () => {
    expect(validateResearchBrief({ ...brief, searchIntent: 'vibes' as never }).ok).toBe(false)
    expect(validateResearchBrief({ ...brief, primaryKeyword: '' }).ok).toBe(false)
    expect(validateResearchBrief({ ...brief, audience: '' }).ok).toBe(false)
  })
})

const source: SourceRecord = {
  sourceId: 's-1', url: 'https://example.com/facas', title: 'Estudo de facas', origin: 'Example Labs',
  accessedAt: '2026-09-20', type: 'industry-report', excerpt: 'dados de desgaste',
}

describe('AB-S4-004 Fontes e citações', () => {
  it('fonte válida passa; URL/título/origem/data ausentes falham', () => {
    expect(validateSourceRecord(source).ok).toBe(true)
    expect(validateSourceRecord({ ...source, url: 'not-a-url' }).ok).toBe(false)
    expect(validateSourceRecord({ ...source, title: '' }).ok).toBe(false)
    expect(validateSourceRecord({ ...source, accessedAt: 'ontem' }).ok).toBe(false)
    expect(validateSourceRecord({ ...source, type: 'rumor' as never }).ok).toBe(false)
  })

  it('claim sem fonte suportante fica bloqueada', () => {
    const ok = checkClaimSupport({ text: 'faca X dura mais', sourceIds: ['s-1'] }, [source])
    expect(ok.supported).toBe(true)
    const missing = checkClaimSupport({ text: 'claim', sourceIds: ['s-404'] }, [source])
    expect(missing.supported).toBe(false)
    expect(missing.missing).toEqual(['s-404'])
  })
})

describe('AB-S4-005 Draft de artigo', () => {
  const input = {
    articleId: 'art-1', projectId: 'ap-1', title: 'Melhor faca de chef em 2026',
    slug: 'melhor-faca-de-chef-2026', metaDescription: 'Guia com teste de desgaste e comparação de lâminas para cozinheiros amadores.',
    outline: ['Introdução', 'Critérios', 'Comparativo'], authorPersonaId: 'persona-1', personaVersionId: 'pv-1',
    sourceIds: ['s-1'],
    bodyHtml: '<p>Melhor faca de chef: análise.</p><h2>Introdução</h2><p>melhor faca de chef em uso diário — melhor faca de chef resiste.</p><h2>Critérios</h2><p>Usamos <a href="/metodologia">nossa metodologia</a>.</p><h2>Comparativo</h2><p>Faca A vs Faca B.</p>',
  }

  it('cria draft com status draft e contagem automática', () => {
    const d = createArticleDraft(input)
    expect(d.status).toBe('draft')
    expect(d.version).toBe(1)
    expect(d.wordCount).toBeGreaterThan(10)
  })

  it('valida slug, outline, corpo, persona e fontes', () => {
    expect(() => createArticleDraft({ ...input, slug: 'Slug Inválido' })).toThrow(ArticleValidationError)
    expect(() => createArticleDraft({ ...input, outline: ['só uma'] })).toThrow()
    expect(() => createArticleDraft({ ...input, bodyHtml: '' })).toThrow()
    expect(() => createArticleDraft({ ...input, authorPersonaId: '' })).toThrow()
    expect(() => createArticleDraft({ ...input, sourceIds: [] })).toThrow()
    expect(() => createArticleDraft({ ...input, title: 'curto' })).toThrow()
  })
})

describe('AB-S4-006 Fact check e claims', () => {
  const draft = createArticleDraft({
    articleId: 'art-1', projectId: 'ap-1', title: 'Melhor faca de chef em 2026',
    slug: 'melhor-faca-de-chef', outline: ['a', 'b', 'c'], authorPersonaId: 'p1', personaVersionId: 'pv-1',
    sourceIds: ['s-1'], bodyHtml: '<p>texto</p>',
    claims: [
      { claimId: 'c-1', text: 'Faca A dura 30% mais', classification: 'fact', sourceIds: ['s-1'] },
      { claimId: 'c-2', text: 'Faca B deve lançar em 2027', classification: 'hypothesis', sourceIds: [] },
    ],
  })

  it('fato com fonte passa; fato sem fonte vira blocker', () => {
    const ok = factCheckDraft(draft, [source])
    expect(ok.ok).toBe(true)
    const bad = factCheckDraft({ ...draft, claims: [...draft.claims!, { claimId: 'c-3', text: 'x', classification: 'fact', sourceIds: ['s-404'] }] }, [source])
    expect(bad.ok).toBe(false)
    expect(bad.blockers[0]).toContain('c-3')
  })

  it('fonte declarada inexistente é blocker', () => {
    const bad = factCheckDraft({ ...draft, sourceIds: ['s-ghost'] }, [source])
    expect(bad.ok).toBe(false)
    expect(bad.blockers.join(' ')).toContain('s-ghost')
  })
})

describe('AB-S4-007 SEO review', () => {
  const draft = createArticleDraft({
    articleId: 'art-1', projectId: 'ap-1', title: 'Melhor faca de chef em 2026',
    slug: 'melhor-faca-de-chef-2026', metaDescription: 'Guia com teste de desgaste e comparação de lâminas para cozinheiros amadores.',
    outline: ['Introdução', 'Critérios', 'Comparativo'], authorPersonaId: 'p1', personaVersionId: 'pv-1',
    sourceIds: ['s-1'],
    bodyHtml: '<p>Melhor faca de chef: análise.</p><h2>Introdução</h2><p>melhor faca de chef em uso diário — melhor faca de chef resiste.</p><h2>Critérios</h2><p>Usamos <a href="/metodologia">nossa metodologia</a>.</p><h2>Comparativo</h2><p>Faca A vs Faca B.</p>',
  })

  it('avalia título, slug, headings, densidade, meta e links internos', () => {
    const r = seoReviewDraft(draft, { primaryKeyword: 'melhor faca de chef', searchIntent: 'comparative' })
    expect(r.score).toBeGreaterThan(60)
    expect(r.checks.map(c => c.name)).toEqual(expect.arrayContaining(['keyword-title', 'keyword-slug', 'headings-h2', 'meta-length', 'internal-links']))
    expect(r.note).toContain('não aprova fatos')
  })

  it('meta fora da faixa reduz nota', () => {
    const r = seoReviewDraft({ ...draft, metaDescription: 'curto' }, { primaryKeyword: 'melhor faca de chef', searchIntent: 'comparative' })
    expect(r.checks.find(c => c.name === 'meta-length')!.pass).toBe(false)
    expect(r.score).toBeLessThan(100)
  })

  it('meta de ~1300 palavras com veredito de desvio', () => {
    expect(WORD_COUNT_TARGET).toBe(1300)
    expect(wordCountVerdict(1300).onTarget).toBe(true)
    expect(wordCountVerdict(800).requiresJustification).toBe(true)
  })
})

const asset: MediaAsset = {
  assetId: 'img-1', kind: 'image', origin: 'Unsplash', license: 'cc0', attributionRequired: false,
  widthPx: 1200, heightPx: 800, altText: 'Faca de chef sobre tábua de madeira',
}

describe('AB-S4-008/009 Mídia', () => {
  it('asset válido passa; alt text e dimensões são obrigatórios', () => {
    expect(validateAsset(asset).ok).toBe(true)
    expect(validateAsset({ ...asset, altText: '' }).ok).toBe(false)
    expect(validateAsset({ ...asset, widthPx: 0 }).ok).toBe(false)
    expect(checkAssetRights({ ...asset, license: 'generated-owned', generatorPrompt: 'p', generatorModel: 'm' }).allowed).toBe(true)
  })

  it('licença com atribuição exige texto de atribuição', () => {
    expect(validateAsset({ ...asset, license: 'cc-by', attributionRequired: true }).ok).toBe(false)
    expect(validateAsset({ ...asset, license: 'cc-by', attributionRequired: true, attributionText: 'Foto: X' }).ok).toBe(true)
  })

  it('media QA gera blockers e warnings reproduzíveis', () => {
    const bad = mediaQa({ ...asset, altText: 'curta' })
    expect(bad.pass).toBe(false)
    expect(bad.issues.find(i => i.code === 'ALT_TEXT_SHORT')!.severity).toBe('blocker')
    const heavy = mediaQa({ ...asset, bytesEstimate: 900_000 })
    expect(heavy.issues.find(i => i.code === 'FILE_TOO_HEAVY')).toBeTruthy()
    const ok = mediaQa(asset)
    expect(ok.pass).toBe(true)
  })
})
