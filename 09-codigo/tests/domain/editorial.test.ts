/**
 * SPRINT S4 backend — testes: perfil derivado, briefing, fontes,
 * fact check e drafts.
 */
import { describe, expect, it } from 'vitest'
import {
  approveDraftIfSupported,
  createArticleDraft,
  deriveEditorialProfile,
  factCheck,
  reviseDraft,
  validateResearchBrief,
  validateSource,
  type ResearchBrief,
  type RegisteredSource,
} from '../../packages/domain/editorial'
import { fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'

describe('AB-S4-001 — perfil editorial derivado', () => {
  it('carrega voz, pilares, guardrails e proibidos da Persona', () => {
    const p = deriveEditorialProfile(fixturePersonaIntakePackage, 'ap-1', 'pt-BR')
    expect(p.voice).toBe(fixturePersonaIntakePackage.snapshot.editorialProfile.voice)
    expect(p.pillars).toEqual(fixturePersonaIntakePackage.snapshot.editorialProfile.editorialPillars)
    expect(p.prohibitedTopics.length).toBeGreaterThan(0)
    expect(p.disclosureTemplate).toBe(fixturePersonaIntakePackage.snapshot.disclosurePolicy.affiliateDisclosureTemplate)
    expect(p.disclosureTemplate.length).toBeGreaterThan(10)
  })

  it('ajustes permitidos: vocabulary/formats/cadence', () => {
    const p = deriveEditorialProfile(fixturePersonaIntakePackage, 'ap-1', 'pt-BR', [
      { field: 'vocabulary', add: ['novo-termo'] },
      { field: 'cadence', add: ['3 artigos/semana'] },
    ])
    expect(p.vocabulary).toContain('novo-termo')
    expect(p.cadence).toBe('3 artigos/semana')
  })

  it('voz/pilares/guardrails não são ajustáveis (imutáveis por herança)', () => {
    const p = deriveEditorialProfile(fixturePersonaIntakePackage, 'ap-1', 'pt-BR', [{ field: 'vocabulary', add: ['x'] }])
    expect(p.voice).toBe(fixturePersonaIntakePackage.snapshot.editorialProfile.voice)
    expect(p.pillars).toHaveLength(fixturePersonaIntakePackage.snapshot.editorialProfile.editorialPillars.length)
  })
})

describe('AB-S4-003 — briefing de pesquisa', () => {
  const valid: ResearchBrief = {
    id: 'brief-1',
    projectId: 'ap-1',
    intent: 'informational',
    primaryKeyword: 'contrato intake',
    secondaryTerms: ['binding', 'hash'],
    audience: 'leitores técnicos',
    keyPoints: ['p1', 'p2', 'p3', 'p4'],
    limitations: ['sem pesquisa real em fixture'],
    sourceIds: ['src-1'],
    createdAt: '2026-09-22T00:00:00.000Z',
  }

  it('briefing válido passa', () => expect(validateResearchBrief(valid).ok).toBe(true))

  it('menos de 4 pontos concretos rejeita', () => {
    expect(validateResearchBrief({ ...valid, keyPoints: ['só um'] }).errors.some((e) => e.code === 'MIN_FOUR_POINTS')).toBe(true)
  })

  it('sem limitações ou fontes rejeita', () => {
    expect(validateResearchBrief({ ...valid, limitations: [] }).ok).toBe(false)
    expect(validateResearchBrief({ ...valid, sourceIds: [] }).ok).toBe(false)
  })

  it('intent inválida rejeita por campo', () => {
    expect(validateResearchBrief({ ...valid, intent: 'outra' as never }).errors.some((e) => e.field === 'intent')).toBe(true)
  })
})

describe('AB-S4-004 — registro de fontes', () => {
  const valid: RegisteredSource = {
    id: 'src-1',
    url: 'https://example.com/fonte',
    title: 'Fonte de exemplo [fixture]',
    origin: 'example.com',
    accessedAt: '2026-09-22T00:00:00.000Z',
    type: 'official',
    supportsClaim: 'contrato exige hash',
  }

  it('fonte válida passa', () => expect(validateSource(valid).ok).toBe(true))
  it('URL inválida rejeita', () => expect(validateSource({ ...valid, url: 'ftp://x' }).ok).toBe(false))
  it('sem claim sustentado rejeita', () => expect(validateSource({ ...valid, supportsClaim: '' }).ok).toBe(false))
  it('tipo inválido rejeita', () => expect(validateSource({ ...valid, type: 'rumor' as never }).ok).toBe(false))
})

describe('AB-S4-006 — fact check', () => {
  it('claim fato sem fonte registrada é bloqueado, nunca fato', () => {
    const out = factCheck([{ text: 'dato sem fonte', classification: 'fact', sourceIds: ['inexistente'] }], new Set(['src-1']))
    expect(out[0].claim.classification).toBe('blocked')
    expect(out[0].adjusted).toBe(true)
  })

  it('claim fato com fonte registrada permanece fato', () => {
    const out = factCheck([{ text: 'dato com fonte', classification: 'fact', sourceIds: ['src-1'] }], new Set(['src-1']))
    expect(out[0].claim.classification).toBe('fact')
    expect(out[0].adjusted).toBe(false)
  })

  it('hipótese e opinião não exigem fonte', () => {
    const out = factCheck([
      { text: 'talvez funcione', classification: 'hypothesis', sourceIds: [] },
      { text: 'na minha visão', classification: 'opinion', sourceIds: [] },
    ], new Set())
    expect(out.map((o) => o.claim.classification)).toEqual(['hypothesis', 'opinion'])
  })
})

describe('AB-S4-005 — draft de artigo', () => {
  const input = {
    id: 'draft-1',
    projectId: 'ap-1',
    title: 'Guia de contratos [fixture]',
    slug: 'guia-de-contratos',
    metaDescription: 'Descrição do guia',
    outline: ['intro', 'desenvolvimento', 'conclusão'],
    body: 'Um dois três quatro cinco seis sete oito nove dez.',
    authorPersonaVersionId: fixturePersonaIntakePackage.personaVersionId,
    sourceIds: ['src-1'],
    claims: [{ text: 'contrato exige hash', classification: 'fact' as const, sourceIds: ['src-1'] }],
  }

  it('nasce como draft, versão 1, com contagem de palavras', () => {
    const d = createArticleDraft(input, '2026-09-22T00:00:00.000Z')
    expect(d.status).toBe('draft')
    expect(d.version).toBe(1)
    expect(d.wordCount).toBe(10)
  })

  it('campos inválidos impedem criação', () => {
    expect(() => createArticleDraft({ ...input, slug: 'Inválido' }, '2026-09-22T00:00:00.000Z')).toThrow(/invalid draft/)
  })

  it('revisão incrementa versão e recalcula contagem, voltando a draft', () => {
    const d = createArticleDraft(input, '2026-09-22T00:00:00.000Z')
    const r = reviseDraft(d, { body: 'uma palavra' }, '2026-09-22T01:00:00.000Z')
    expect(r.version).toBe(2)
    expect(r.wordCount).toBe(2)
    expect(r.status).toBe('draft')
  })

  it('aprovação exige todos os claims fatuais sustentados e fontes', () => {
    const ok = createArticleDraft(input, '2026-09-22T00:00:00.000Z')
    expect(approveDraftIfSupported(ok).approved).toBe(true)
    const noSource = createArticleDraft({ ...input, sourceIds: [] }, '2026-09-22T00:00:00.000Z')
    expect(approveDraftIfSupported(noSource)).toEqual({ approved: false, reason: 'NO_SOURCES' })
    const blocked = createArticleDraft({ ...input, claims: [{ text: 'x', classification: 'blocked' as const, sourceIds: [] }] }, '2026-09-22T00:00:00.000Z')
    expect(approveDraftIfSupported(blocked).reason).toBe('BLOCKED_CLAIM_PRESENT')
  })
})
