/**
 * Track B — AB-S3-003/004/005/006: registry de templates, renderizador, catálogo de componentes e editor visual.
 */
import { describe, expect, it } from 'vitest'
import {
  CANONICAL_BLOCK_ORDER, TEMPLATE_REGISTRY, checkTemplateCompatibility, checkTemplateVersion,
  compareSemver, findLatestTemplate, findTemplate, listTemplates,
} from '../../packages/template-engine/src/registry'
import {
  COMPONENT_CATALOG, checkComponentTemplateCompatibility, findComponent, validateComponentPayload,
} from '../../packages/template-engine/src/components'
import { renderPage, renderPageHtml, type PageContent } from '../../packages/template-engine/src/renderer'
import {
  EDITOR_MODEL_VERSION, reorderBlocks, restoreVersion, saveComposition, setBlockVariant, setViewport,
  validateComposition, type EditorComposition,
} from '../../packages/template-engine/src/visual-editor'

const content: PageContent = {
  siteName: 'Piloto',
  hero: { title: 'Guia definitivo de X', subtitle: 'Análises independentes', ctaLabel: 'Começar', ctaHref: '/guias' },
  intro: { text: 'Conteúdo prático e verificável.' },
  articles: [
    { slug: 'como-fazer-y', title: 'Como fazer Y', excerpt: 'Passo a passo', category: 'guias' },
    { slug: 'comparativo-a-b', title: 'A vs B', excerpt: 'Qual vale mais', category: 'analises' },
  ],
  featured: { title: 'Guia destaque', summary: 'Resumo do guia', href: '/guias/destaque', tag: 'GUIA' },
  newsletter: { title: 'Newsletter semanal' },
  faq: { items: [{ question: 'O que é?', answer: 'Definição.' }] },
  footer: { links: [{ label: 'Sobre', href: '/sobre' }], disclosure: 'Links de afiliados.' },
}

describe('AB-S3-003 Registry', () => {
  it('registry possui templates não deprecados e versão antiga identificável', () => {
    const active = listTemplates()
    expect(active.length).toBeGreaterThan(0)
    const all = listTemplates({ includeDeprecated: true })
    expect(all.length).toBeGreaterThan(active.length)
    const deprecated = all.filter(t => t.deprecated)
    expect(deprecated.every(d => d.notes)).toBe(true)
  })

  it('versão pinada válida passa; deprecada falha com updateAvailable', () => {
    expect(checkTemplateVersion('editorial-reference', '1.0.0').ok).toBe(true)
    const dep = checkTemplateVersion('editorial-reference', '0.9.0')
    expect(dep.ok).toBe(false)
    expect(dep.code).toBe('TEMPLATE_DEPRECATED')
    expect(dep.updateAvailable).toBe(true)
    expect(checkTemplateVersion('editorial-reference', '9.9.9').code).toBe('TEMPLATE_NOT_FOUND')
  })

  it('compareSemver ordena corretamente', () => {
    expect(compareSemver('1.0.0', '0.9.0')).toBeGreaterThan(0)
    expect(compareSemver('1.2.3', '1.2.3')).toBe(0)
    expect(findLatestTemplate('editorial-reference')!.version).toBe('1.0.0')
    expect(findTemplate('editorial-reference', '0.9.0')!.deprecated).toBe(true)
  })

  it('compatibilidade exige componentes requeridos', () => {
    const t = findTemplate('editorial-reference', '1.0.0')!
    expect(checkTemplateCompatibility(t, ['hero', 'article-grid', 'comparison-table', 'product-card', 'newsletter', 'faq', 'footer']).ok).toBe(true)
    const miss = checkTemplateCompatibility(t, ['hero'])
    expect(miss.ok).toBe(false)
    expect(miss.missing).toContain('comparison-table')
  })

  it('ordem canônica cobre todos os blocos de todos os templates', () => {
    for (const t of TEMPLATE_REGISTRY) {
      for (const b of t.blocks) expect(CANONICAL_BLOCK_ORDER).toContain(b)
    }
  })
})

describe('AB-S3-005 Catálogo de componentes', () => {
  it('cada componente tem schema, variantes e compatibilidade', () => {
    expect(COMPONENT_CATALOG.length).toBeGreaterThanOrEqual(15)
    for (const c of COMPONENT_CATALOG) {
      expect(c.variants.length).toBeGreaterThan(0)
      expect(c.fields.length).toBeGreaterThan(0)
    }
  })

  it('payload válido passa; obrigatório ausente falha; tipo errado falha', () => {
    expect(validateComponentPayload('hero', { title: 'T' }).ok).toBe(true)
    const missing = validateComponentPayload('hero', {})
    expect(missing.ok).toBe(false)
    expect(missing.errors[0]).toContain('title')
    const bad = validateComponentPayload('product-card', { title: 'P', href: '/x', price: 10 })
    expect(bad.ok).toBe(false)
  })

  it('componente incompatível com família é rejeitado; capability ausente rejeita', () => {
    const rej = checkComponentTemplateCompatibility('comparison-table', 'lifestyle', ['homepage'])
    expect(rej.ok).toBe(false)
    const cap = checkComponentTemplateCompatibility('faq', 'editorial-revista', ['homepage'])
    expect(cap.ok).toBe(false)
    expect(cap.errors.join(' ')).toContain('faq')
    const ok = checkComponentTemplateCompatibility('checklist', 'lifestyle', ['homepage'])
    expect(ok.ok).toBe(true)
    expect(findComponent('hero')!.variants.map(v => v.id)).toContain('split-media')
  })
})

describe('AB-S3-004 Renderizador', () => {
  it('renderiza homepage com todos os blocos e landmarks', () => {
    const page = renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content })
    expect(page.ok).toBe(true)
    expect(page.blocks.map(b => b.block)).toEqual(CANONICAL_BLOCK_ORDER)
    expect(page.landmarks).toContain('banner')
    expect(page.landmarks).toContain('main')
    expect(page.landmarks).toContain('contentinfo')
    const html = renderPageHtml(page)
    expect(html).toContain('<h1>')
    expect(html).toContain('role="contentinfo"')
  })

  it('renderização é determinística (mesma entrada → mesmo HTML)', () => {
    const a = renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content }))
    const b = renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content }))
    expect(a).toBe(b)
  })

  it('conteúdo ausente produz estado vazio tratado (sem crash)', () => {
    const page = renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content: { siteName: 'Vazio', articles: [] } })
    expect(page.ok).toBe(true)
    const empties = page.blocks.filter(b => b.empty)
    expect(empties.length).toBeGreaterThan(0)
    expect(renderPageHtml(page)).toContain('ab-empty-state')
  })

  it('artigo renderiza com H1 e data vira estado vazio', () => {
    const art = renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'article', content: { ...content, article: { slug: 'como-fazer-y', title: content.articles[0].title, excerpt: content.articles[0].excerpt, sections: [{ heading: 'Como fazer', html: '<p>Passo a passo.</p>' }] } } })
    const main = art.blocks.find(b => b.role === 'main')!
    expect(main.html).toContain('<article')
    expect(main.html).toContain('<h1>')
    const none = renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'article', content: { siteName: 'x', articles: [] } })
    expect(none.blocks.some(b => b.empty && b.html.includes('não existe'))).toBe(true)
  })

  it('template não registrado retorna erro estruturado', () => {
    const page = renderPage({ templateId: 'inexistente', templateVersion: '1.0.0', pageKind: 'homepage', content })
    expect(page.ok).toBe(false)
    expect(page.errors[0].code).toBe('TEMPLATE_NOT_FOUND')
  })

  it('viewport desktop/mobile é registrada no output', () => {
    expect(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content, viewport: 'mobile' }).viewport).toBe('mobile')
  })
})

describe('AB-S3-006 Editor visual controlado', () => {
  const template = findTemplate('editorial-reference', '1.0.0')!
  const composition: EditorComposition = {
    compositionId: 'comp-1', modelVersion: EDITOR_MODEL_VERSION,
    templateId: 'editorial-reference', templateVersion: '1.0.0',
    blocks: template.blocks.map(b => ({ block: b })),
    viewport: 'desktop', savedAtVersion: 1, status: 'draft',
  }

  it('composição inicial do template valida', () => {
    expect(validateComposition(composition).ok).toBe(true)
  })

  it('rejeita bloco fora do template, duplicado e variante não registrada', () => {
    const foreign = { ...composition, blocks: [...composition.blocks, { block: 'chat-widget' }] } as unknown as EditorComposition
    expect(validateComposition(foreign).ok).toBe(false)
    const dup = { ...composition, blocks: [...composition.blocks, { block: 'hero' }] } as unknown as EditorComposition
    expect(validateComposition(dup).ok).toBe(false)
    const badVariant = setBlockVariant(composition, 'hero', 'hologram')
    expect(badVariant.ok).toBe(false)
  })

  it('reordenar preserva conjunto; ordem diferente é permitida', () => {
    const newOrder = [...template.blocks].reverse()
    const r = reorderBlocks(composition, newOrder)
    expect(r.ok).toBe(true)
    expect(r.composition!.blocks.map(b => b.block)).toEqual(newOrder)
    const drop = reorderBlocks(composition, template.blocks.slice(1))
    expect(drop.ok).toBe(false)
  })

  it('trocar variante válida e viewport funcionam', () => {
    const v = setBlockVariant(composition, 'hero', 'split-media')
    expect(v.ok).toBe(true)
    expect(v.composition!.blocks.find(b => b.block === 'hero')!.variant).toBe('split-media')
    const vp = setViewport(composition, 'mobile')
    expect(vp.composition!.viewport).toBe('mobile')
  })

  it('salvar cria versão draft; restaurar recupera anterior; inválida não salva', () => {
    let history: ReturnType<typeof saveComposition>['history'] = []
    const s1 = saveComposition(history, composition, 'agent-b', 'inicial')
    history = s1.history
    const changed = setBlockVariant(composition, 'hero', 'statement')!.composition!
    const s2 = saveComposition(history, changed, 'agent-b', 'variante statement')
    history = s2.history
    expect(s2.version).toBe(2)
    expect(history).toHaveLength(2)
    const restored = restoreVersion(history, 1, 'agent-b')!
    expect(restored.restored.blocks.find(b => b.block === 'hero')!.variant).toBeUndefined()
    expect(restored.restored.status).toBe('draft')
    expect(restoreVersion(history, 99, 'agent-b')).toBeNull()
    const invalid = { ...composition, blocks: [] }
    expect(() => saveComposition(history, invalid, 'agent-b', 'x')).toThrow()
  })

  it('salvar nunca publica: status permanece draft', () => {
    const s = saveComposition([], composition, 'agent-b', 'inicial')
    expect(s.history[0].composition.status).toBe('draft')
  })
})
