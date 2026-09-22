/**
 * Renderizador determinístico de páginas editoriais (AB-S3-004).
 * Renderiza homepage, categoria e artigo com blocos versionados; saída é uma árvore de layout + HTML estável.
 * Conteúdo ausente produz estado vazio tratado; landmarks e headings acessíveis.
 */
import { CANONICAL_BLOCK_ORDER, findTemplate, type BlockType, type TemplateDefinition } from './registry'

export const RENDERER_VERSION = 1

export type RenderError = { code: string; message: string }

export type ArticleRef = {
  slug: string
  title: string
  excerpt?: string
  category?: string
  publishedAt?: string
}

export type PageContent = {
  siteName: string
  tagline?: string
  hero?: { title: string; subtitle?: string; ctaLabel?: string; ctaHref?: string }
  intro?: { text: string }
  articles: ArticleRef[]
  featured?: { title: string; summary: string; href: string; tag?: string }
  category?: { slug: string; name: string; description?: string }
  article?: {
    slug: string
    title: string
    excerpt?: string
    bodyHtml?: string
    sections?: { heading: string; html?: string }[]
    readingMinutes?: number
    updatedAt?: string
  }
  newsletter?: { title: string; description?: string; ctaLabel?: string }
  faq?: { items: { question: string; answer: string }[] }
  footer?: { links: { label: string; href: string }[]; disclosure?: string }
}

export type PageKind = 'homepage' | 'category' | 'article'

export type RenderedBlock = {
  block: BlockType
  variant?: string
  role: string
  heading?: string
  html: string
  empty?: boolean
}

export type RenderedPage = {
  ok: boolean
  pageKind: PageKind
  templateId: string
  templateVersion: string
  rendererVersion: number
  viewport: 'desktop' | 'mobile' | null
  blocks: RenderedBlock[]
  errors: RenderError[]
  landmarks: string[]
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderHero(content: PageContent): RenderedBlock {
  const h = content.hero
  if (!h?.title) return emptyBlock('hero', 'region', 'hero ausente')
  const cta = h.ctaLabel && h.ctaHref ? `<p><a class="ab-cta" href="${esc(h.ctaHref)}">${esc(h.ctaLabel)}</a></p>` : ''
  return {
    block: 'hero', variant: 'headline-focus', role: 'banner', heading: h.title,
    html: `<header class="ab-block ab-hero" role="banner"><h1>${esc(h.title)}</h1>${h.subtitle ? `<p class="ab-subtitle">${esc(h.subtitle)}</p>` : ''}${cta}</header>`,
  }
}

function renderIntro(content: PageContent): RenderedBlock {
  const i = content.intro
  if (!i?.text) return emptyBlock('intro', 'region', 'intro ausente')
  return { block: 'intro', role: 'region', html: `<section class="ab-block ab-intro" aria-label="Introdução"><p>${esc(i.text)}</p></section>` }
}

function renderArticleGrid(content: PageContent, pageKind: PageKind): RenderedBlock {
  const arts = content.articles ?? []
  const heading = pageKind === 'category' && content.category ? content.category.name : 'Artigos'
  if (arts.length === 0) {
    return { block: 'article-grid', role: 'main', heading, empty: true, html: `<main class="ab-block ab-grid ab-empty" role="main" aria-label="${esc(heading)}"><p class="ab-empty-state">Nenhum conteúdo publicado ainda — em breve.</p></main>` }
  }
  const items = arts.map(a => `<li class="ab-card"><a href="/${esc(a.category ?? 'artigos')}/${esc(a.slug)}"><h3>${esc(a.title)}</h3>${a.excerpt ? `<p>${esc(a.excerpt)}</p>` : ''}</a></li>`).join('')
  return {
    block: 'article-grid', role: 'main', heading,
    html: `<main class="ab-block ab-grid" role="main" aria-label="${esc(heading)}"><h2>${esc(heading)}</h2><ul class="ab-grid-list">${items}</ul></main>`,
  }
}

function renderFeatured(content: PageContent): RenderedBlock {
  const fg = content.featured
  if (!fg?.title) return emptyBlock('featured-guide', 'region', 'featured ausente')
  return {
    block: 'featured-guide', role: 'complementary', heading: fg.title,
    html: `<aside class="ab-block ab-featured" aria-label="Guia em destaque">${fg.tag ? `<p class="ab-tag">${esc(fg.tag)}</p>` : ''}<h2><a href="${esc(fg.href)}">${esc(fg.title)}</a></h2><p>${esc(fg.summary)}</p></aside>`,
  }
}

function renderComparison(content: PageContent): RenderedBlock {
  // Comparison usa artigos comparativos quando não há tabela dedicada; estado vazio tratado.
  if (!content.featured && (content.articles ?? []).length === 0) return emptyBlock('comparison', 'region', 'sem conteúdo comparável')
  const items = (content.articles ?? []).slice(0, 3).map(a => `<li>${esc(a.title)}</li>`).join('')
  return { block: 'comparison', role: 'region', html: `<section class="ab-block ab-comparison" aria-label="Comparativos"><h2>Comparativos</h2><ul>${items}</ul></section>` }
}

function renderProductRecommendation(content: PageContent): RenderedBlock {
  const art = content.article
  const hasAffiliate = Boolean(art?.bodyHtml && art.bodyHtml.includes('ab-affiliate'))
  if (!hasAffiliate) {
    return {
      block: 'product-recommendation', role: 'region', empty: true,
      html: `<section class="ab-block ab-product ab-empty" aria-label="Recomendações"><p class="ab-empty-state">Nenhuma recomendação de produto vinculada (sem afiliado aprovado).</p></section>`,
    }
  }
  return { block: 'product-recommendation', role: 'region', html: `<section class="ab-block ab-product" aria-label="Recomendações">Recomendações com disclosure afiliado.</section>` }
}

function renderNewsletter(content: PageContent): RenderedBlock {
  const n = content.newsletter
  if (!n?.title) return emptyBlock('newsletter', 'region', 'newsletter ausente')
  return {
    block: 'newsletter', role: 'complementary',
    html: `<aside class="ab-block ab-newsletter" aria-label="Newsletter"><h2>${esc(n.title)}</h2>${n.description ? `<p>${esc(n.description)}</p>` : ''}<form class="ab-newsletter-form" aria-label="Assinar newsletter"><label class="ab-sr-only" for="ab-newsletter-email">E-mail</label><input id="ab-newsletter-email" type="email" name="email" placeholder="seu@email.com" required /><button type="submit">${esc(n.ctaLabel ?? 'Assinar')}</button></form></aside>`,
  }
}

function renderFaq(content: PageContent): RenderedBlock {
  const faq = content.faq
  if (!faq?.items?.length) return emptyBlock('faq', 'region', 'FAQ ausente')
  const items = faq.items.map((it, i) => `<div class="ab-faq-item"><h3><button type="button" aria-expanded="false" aria-controls="ab-faq-panel-${i}" id="ab-faq-trigger-${i}">${esc(it.question)}</button></h3><div class="ab-faq-panel" id="ab-faq-panel-${i}" role="region" aria-labelledby="ab-faq-trigger-${i}"><p>${esc(it.answer)}</p></div></div>`).join('')
  return { block: 'faq', role: 'region', html: `<section class="ab-block ab-faq" aria-label="Perguntas frequentes"><h2>Perguntas frequentes</h2>${items}</section>` }
}

function renderFooter(content: PageContent): RenderedBlock {
  const fo = content.footer
  const links = fo?.links?.map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('') ?? ''
  const disclosure = fo?.disclosure ? `<p class="ab-disclosure">${esc(fo.disclosure)}</p>` : '<p class="ab-disclosure">Conteúdo com links de afiliados pode gerar comissão.</p>'
  return {
    block: 'footer', role: 'contentinfo',
    html: `<footer class="ab-block ab-footer" role="contentinfo">${links ? `<nav aria-label="Rodapé"><ul>${links}</ul></nav>` : ''}${disclosure}</footer>`,
  }
}

function emptyBlock(block: BlockType, role: string, reason: string): RenderedBlock {
  return { block, role, empty: true, html: `<div class="ab-block ab-empty" data-block="${block}"><p class="ab-empty-state">${esc(reason)}</p></div>` }
}

function renderArticleBody(content: PageContent): RenderedBlock[] {
  const a = content.article
  if (!a?.title) {
    return [{ block: 'article-grid', role: 'main', empty: true, html: `<main class="ab-block ab-empty" role="main"><h1>Artigo não encontrado</h1><p class="ab-empty-state">O conteúdo solicitado não existe ou está em rascunho.</p></main>` }]
  }
  const meta: string[] = []
  if (a.readingMinutes) meta.push(`<li>${a.readingMinutes} min de leitura</li>`)
  if (a.updatedAt) meta.push(`<li>Atualizado em ${esc(a.updatedAt)}</li>`)
  const sections = (a.sections ?? []).map(s => `<section><h2>${esc(s.heading)}</h2>${s.html ?? ''}</section>`).join('')
  const body = a.bodyHtml ?? sections
  return [{
    block: 'article-grid', role: 'main', heading: a.title,
    html: `<article class="ab-block ab-article" role="main"><h1>${esc(a.title)}</h1>${a.excerpt ? `<p class="ab-subtitle">${esc(a.excerpt)}</p>` : ''}${meta.length ? `<ul class="ab-meta">${meta.join('')}</ul>` : ''}<div class="ab-article-body">${body}</div></article>`,
  }]
}

/** Renderiza a página conforme template fixado. Determinístico: mesmo manifesto/conteúdo → mesma saída. */
export function renderPage(input: {
  templateId: string
  templateVersion: string
  pageKind: PageKind
  content: PageContent
  viewport?: 'desktop' | 'mobile' | null
}): RenderedPage {
  const errors: RenderError[] = []
  const template: TemplateDefinition | undefined = findTemplate(input.templateId, input.templateVersion)
  if (!template) {
    return {
      ok: false, pageKind: input.pageKind, templateId: input.templateId, templateVersion: input.templateVersion,
      rendererVersion: RENDERER_VERSION, viewport: input.viewport ?? null, blocks: [], errors: [{ code: 'TEMPLATE_NOT_FOUND', message: `template ${input.templateId}@${input.templateVersion} não registrado` }], landmarks: [],
    }
  }

  const blocks: RenderedBlock[] = []
  const ordered = [...template.blocks].sort((a, b) => CANONICAL_BLOCK_ORDER.indexOf(a) - CANONICAL_BLOCK_ORDER.indexOf(b))

  for (const block of ordered) {
    switch (block) {
      case 'hero': blocks.push(renderHero(input.content)); break
      case 'intro': blocks.push(renderIntro(input.content)); break
      case 'article-grid':
        if (input.pageKind === 'article') blocks.push(...renderArticleBody(input.content))
        else blocks.push(renderArticleGrid(input.content, input.pageKind))
        break
      case 'featured-guide': blocks.push(renderFeatured(input.content)); break
      case 'comparison': blocks.push(renderComparison(input.content)); break
      case 'product-recommendation': blocks.push(renderProductRecommendation(input.content)); break
      case 'newsletter': blocks.push(renderNewsletter(input.content)); break
      case 'faq': blocks.push(renderFaq(input.content)); break
      case 'footer': blocks.push(renderFooter(input.content)); break
    }
  }

  const landmarks = blocks.map(b => b.role).filter(r => ['banner', 'main', 'complementary', 'contentinfo', 'region'].includes(r))
  return {
    ok: errors.length === 0, pageKind: input.pageKind, templateId: template.templateId, templateVersion: template.version,
    rendererVersion: RENDERER_VERSION, viewport: input.viewport ?? null, blocks, errors, landmarks,
  }
}

/** Serialização HTML completa da página (document com landmarks). */
export function renderPageHtml(page: RenderedPage): string {
  if (!page.ok) return `<!DOCTYPE html><html lang="pt-BR"><body><h1>Erro de renderização</h1><p>${page.errors.map(e => esc(e.message)).join('; ')}</p></body></html>`
  const body = page.blocks.map(b => b.html).join('\n')
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Page</title></head><body>\n${body}\n</body></html>`
}
