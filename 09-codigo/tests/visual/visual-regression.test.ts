/**
 * Track B — AB-S3-007: visual regression e accessibility checks sobre template + tokens.
 * Gera "representações comparáveis" (snapshot estável de HTML + assinatura de tokens + checks de
 * keyboard/focus/contrast) e detecta mudanças relevantes; falha bloqueia promoção de template.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { renderPage, renderPageHtml, type PageContent } from '../../packages/template-engine/src/renderer'
import { findNichePreset } from '../../packages/design-system/src/presets'
import { DEFAULT_CONTRAST_PAIRS, validateThemeManifest } from '../../packages/design-system/src/theme-manifest'
import { contrastRatio, meetsAA } from '../../packages/design-system/src/contrast'
import { tokensToCssVariables } from '../../packages/design-system/src/css-variables'

const content: PageContent = {
  siteName: 'Piloto',
  hero: { title: 'Guia definitivo de X', subtitle: 'Análises independentes' },
  articles: [{ slug: 'a', title: 'Artigo A', excerpt: 'resumo', category: 'guias' }],
  newsletter: { title: 'Newsletter' },
  footer: { links: [{ label: 'Sobre', href: '/sobre' }] },
}

function pageSignature(html: string): string {
  return createHash('sha256').update(html).digest('hex')
}

describe('AB-S3-007 Visual regression', () => {
  const viewports = ['desktop', 'mobile'] as const

  it('assinatura visual é estável entre execuções (desktop e mobile)', () => {
    for (const viewport of viewports) {
      const a = pageSignature(renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content, viewport })))
      const b = pageSignature(renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content, viewport })))
      expect(a).toBe(b)
    }
  })

  it('mudança relevante de conteúdo muda a assinatura (detecção funciona)', () => {
    const base = pageSignature(renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content })))
    const changed = pageSignature(renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content: { ...content, hero: { title: 'Título NOVO' } } })))
    expect(base).not.toBe(changed)
  })

  it('baseline registrado: template 1.0.0 homepage não pode mudar sem bump de versão', () => {
    // Baseline imutável desta versão do template — atualizar somente com bump de versão + preview + aprovação.
    const html = renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content }))
    const sig = pageSignature(html)
    expect(sig).toBe('458775e156428fee44c78dadc9c717bd691a27f7394090bb38137bafe7fe58d6')
  })

  it('todas as páginas-chave geram snapshots distintos e válidos', () => {
    const sigs = new Set<string>()
    const contents: Record<string, PageContent> = {
      homepage: content,
      category: { ...content, category: { slug: 'guias', name: 'Guias' }, hero: { title: 'Categoria Guias' } },
      article: { ...content, article: { slug: 'a', title: 'Artigo A', sections: [{ heading: 'S1', html: '<p>x</p>' }] } },
    }
    for (const pageKind of ['homepage', 'category', 'article'] as const) {
      const page = renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind, content: contents[pageKind] })
      expect(page.ok).toBe(true)
      sigs.add(pageSignature(renderPageHtml(page)))
    }
    expect(sigs.size).toBe(3)
  })
})

describe('AB-S3-007 Accessibility checks', () => {
  it('todos os pares default de contraste passam AA nos presets', () => {
    for (const preset of [findNichePreset('niche-editorial-guia')!, findNichePreset('niche-reviews-comparativos')!, findNichePreset('niche-financas-pessoais')!]) {
      const manifest = {
        schemaVersion: 1, themeId: `ab-theme-${preset.niche}`, version: 1, origin: { overrides: [] },
        tokens: preset.tokens, contrastPairs: DEFAULT_CONTRAST_PAIRS,
      }
      const v = validateThemeManifest(manifest)
      expect(v.ok, preset.id).toBe(true)
    }
  })

  it('tokens default garantem AA de texto sobre fundo', () => {
    const tokens = findNichePreset('niche-editorial-guia')!.tokens
    for (const pair of DEFAULT_CONTRAST_PAIRS) {
      const ratio = contrastRatio(tokens.colors[pair.fg], tokens.colors[pair.bg])!
      expect(meetsAA(ratio), `${pair.name} = ${ratio}`).toBe(true)
    }
  })

  it('focus ring tem token dedicado e é visível (contraste com background)', () => {
    for (const preset of [findNichePreset('niche-editorial-guia')!, findNichePreset('niche-casa-jardim')!]) {
      const ratio = contrastRatio(preset.tokens.colors.focusRing, preset.tokens.colors.background)!
      expect(meetsAA(ratio, true), `${preset.id}: focusRing ${ratio}`).toBe(true)
    }
  })

  it('HTML renderizado expõe landmarks, headings ordenados e foco keyboard-friendly', () => {
    const html = renderPageHtml(renderPage({ templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage', content }))
    expect(html).toContain('role="banner"')
    expect(html).toContain('role="main"')
    expect(html).toContain('role="contentinfo"')
    expect(html.indexOf('<h1>')).toBeLessThan(html.indexOf('<h2'))
    // formulário de newsletter com label ligado por for/id (navegável por teclado)
    expect(html).toContain('for="ab-newsletter-email"')
    expect(html).toContain('id="ab-newsletter-email"')
    expect(html).toContain('type="email"')
  })

  it('CSS variables cobrem todos os papéis visuais usados pelo preview', () => {
    const tokens = findNichePreset('niche-editorial-guia')!.tokens
    const vars = tokensToCssVariables(tokens)
    const required = ['--ab-color-background', '--ab-color-primary', '--ab-color-focus-ring', '--ab-font-body', '--ab-reading-width', '--ab-container-max']
    for (const name of required) expect(vars[name]).toBeTruthy()
  })
})
