/**
 * Catálogo de componentes de nicho (AB-S3-005).
 * Cada componente tem schema de entrada, variantes registradas e compatibilidade com famílias de template;
 * componente incompatível com o template é rejeitado.
 */
export const COMPONENT_CATALOG_VERSION = 1

export type NicheComponentType =
  | 'hero' | 'article-grid' | 'featured-guide' | 'comparison-table' | 'checklist'
  | 'calculator' | 'timeline' | 'glossary' | 'spec-sheet' | 'expert-box'
  | 'faq' | 'data-table' | 'product-card' | 'newsletter' | 'callout'
  | 'quiz' | 'map' | 'recipe-steps' | 'footer'

export type ComponentVariant = { id: string; label: string; notes?: string }

export type ComponentFieldDef = {
  name: string
  type: 'string' | 'number' | 'boolean' | 'string-array' | 'object-array'
  required: boolean
  notes?: string
}

export type ComponentDefinition = {
  componentType: NicheComponentType
  label: string
  version: number
  variants: ComponentVariant[]
  fields: ComponentFieldDef[]
  compatibleFamilies: string[] | 'any'
  requiresCapability?: string
  notes?: string
}

const f = (name: string, type: ComponentFieldDef['type'], required = true): ComponentFieldDef => ({ name, type, required })
const v = (id: string, label: string, notes?: string): ComponentVariant => ({ id, label, notes })

export const COMPONENT_CATALOG: ComponentDefinition[] = [
  {
    componentType: 'hero', label: 'Hero', version: 1,
    variants: [v('headline-focus', 'Headline Focus'), v('split-media', 'Split Media'), v('statement', 'Statement', 'texto grande sem mídia')],
    fields: [f('title', 'string'), f('subtitle', 'string', false), f('ctaLabel', 'string', false), f('ctaHref', 'string', false), f('media', 'object-array', false)],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'article-grid', label: 'Article Grid', version: 1,
    variants: [v('cards-3', 'Cards 3 colunas'), v('list', 'Lista'), v('magazine', 'Revista')],
    fields: [f('heading', 'string', false), f('articles', 'object-array'), f('columns', 'number', false)],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'featured-guide', label: 'Featured Guide', version: 1,
    variants: [v('wide', 'Destaque largo'), v('sidebar', 'Coluna lateral')],
    fields: [f('title', 'string'), f('summary', 'string'), f('href', 'string'), f('tag', 'string', false)],
    compatibleFamilies: ['guia-referencia', 'editorial-revista', 'blog-autoridade', 'produto-recomendacoes', 'noticias-atualizacoes'],
  },
  {
    componentType: 'comparison-table', label: 'Comparison Table', version: 1,
    variants: [v('rows', 'Linhas'), v('columns', 'Colunas')],
    fields: [f('caption', 'string', false), f('columns', 'string-array'), f('rows', 'object-array')],
    compatibleFamilies: ['reviews-comparativos', 'guia-referencia', 'produto-recomendacoes'],
    requiresCapability: 'comparison',
  },
  {
    componentType: 'checklist', label: 'Checklist', version: 1,
    variants: [v('basic', 'Básica'), v('numbered', 'Numerada')],
    fields: [f('title', 'string'), f('items', 'string-array')],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'calculator', label: 'Calculadora', version: 1,
    variants: [v('inline', 'Inline'), v('panel', 'Painel')],
    fields: [f('title', 'string'), f('formula', 'string'), f('inputs', 'object-array')],
    compatibleFamilies: ['financas' as string, 'guia-referencia', 'produto-recomendacoes'],
    notes: 'famílias financeiras usam calculadora com revisão de fórmula.',
  },
  {
    componentType: 'timeline', label: 'Timeline', version: 1,
    variants: [v('vertical', 'Vertical')],
    fields: [f('title', 'string', false), f('events', 'object-array')],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'glossary', label: 'Glossário', version: 1,
    variants: [v('alpha', 'Alfabético'), v('grouped', 'Agrupado')],
    fields: [f('terms', 'object-array')],
    compatibleFamilies: ['guia-referencia', 'blog-autoridade', 'editorial-revista'],
  },
  {
    componentType: 'spec-sheet', label: 'Ficha Técnica', version: 1,
    variants: [v('table', 'Tabela'), v('cards', 'Cards')],
    fields: [f('title', 'string'), f('specs', 'object-array')],
    compatibleFamilies: ['reviews-comparativos', 'produto-recomendacoes'],
  },
  {
    componentType: 'expert-box', label: 'Box de Especialista', version: 1,
    variants: [v('quote', 'Citação'), v('insight', 'Insight')],
    fields: [f('author', 'string'), f('text', 'string')],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'faq', label: 'FAQ', version: 1,
    variants: [v('accordion', 'Acordeão'), v('static', 'Estático')],
    fields: [f('items', 'object-array')],
    compatibleFamilies: 'any',
    requiresCapability: 'faq',
  },
  {
    componentType: 'data-table', label: 'Tabela de Dados', version: 1,
    variants: [v('striped', 'Zebrada'), v('plain', 'Simples')],
    fields: [f('columns', 'string-array'), f('rows', 'object-array')],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'product-card', label: 'Product Card', version: 1,
    variants: [v('horizontal', 'Horizontal'), v('vertical', 'Vertical'), v('price-compare', 'Comparação de preço')],
    fields: [f('title', 'string'), f('description', 'string', false), f('price', 'string', false), f('href', 'string'), f('disclosure', 'string', false), f('image', 'object-array', false)],
    compatibleFamilies: ['reviews-comparativos', 'produto-recomendacoes', 'guia-referencia', 'lifestyle'],
    requiresCapability: 'product-ads',
  },
  {
    componentType: 'newsletter', label: 'Newsletter', version: 1,
    variants: [v('inline', 'Inline'), v('footer', 'Rodapé')],
    fields: [f('title', 'string'), f('description', 'string', false), f('ctaLabel', 'string', false)],
    compatibleFamilies: 'any',
    requiresCapability: 'newsletter-capture',
  },
  {
    componentType: 'callout', label: 'Callout', version: 1,
    variants: [v('info', 'Informação'), v('warning', 'Aviso'), v('affiliate', 'Afiliado')],
    fields: [f('title', 'string', false), f('text', 'string'), f('variant', 'string', false)],
    compatibleFamilies: 'any',
  },
  {
    componentType: 'quiz', label: 'Quiz', version: 1,
    variants: [v('inline', 'Inline')],
    fields: [f('title', 'string'), f('questions', 'object-array')],
    compatibleFamilies: ['lifestyle', 'produto-recomendacoes', 'comunidade'],
  },
  {
    componentType: 'map', label: 'Mapa', version: 1,
    variants: [v('static', 'Estático')],
    fields: [f('title', 'string', false), f('points', 'object-array')],
    compatibleFamilies: ['lifestyle', 'noticias-atualizacoes', 'guia-referencia'],
  },
  {
    componentType: 'recipe-steps', label: 'Receita/Procedimento', version: 1,
    variants: [v('steps', 'Passos')],
    fields: [f('title', 'string'), f('steps', 'object-array')],
    compatibleFamilies: ['lifestyle', 'casa' as string, 'guia-referencia'],
  },
  {
    componentType: 'footer', label: 'Footer', version: 1,
    variants: [v('standard', 'Padrão'), v('minimal', 'Mínimo')],
    fields: [f('links', 'object-array', false), f('disclosure', 'string', false)],
    compatibleFamilies: 'any',
  },
]

export function findComponent(type: string): ComponentDefinition | undefined {
  return COMPONENT_CATALOG.find(c => c.componentType === type)
}

export type ComponentValidation = { ok: boolean; errors: string[] }

/** Valida payload contra o schema do componente (campos obrigatórios e tipos). */
export function validateComponentPayload(type: string, payload: Record<string, unknown>): ComponentValidation {
  const def = findComponent(type)
  if (!def) return { ok: false, errors: [`componente "${type}" não registrado no catálogo`] }
  const errors: string[] = []
  for (const field of def.fields) {
    const value = payload[field.name]
    if (value === undefined || value === null) {
      if (field.required) errors.push(`campo obrigatório "${field.name}" ausente`)
      continue
    }
    const t = typeof value
    const ok =
      (field.type === 'string' && t === 'string') ||
      (field.type === 'number' && t === 'number' && Number.isFinite(value)) ||
      (field.type === 'boolean' && t === 'boolean') ||
      (field.type === 'string-array' && Array.isArray(value) && value.every(x => typeof x === 'string')) ||
      (field.type === 'object-array' && Array.isArray(value) && value.every(x => x && typeof x === 'object'))
    if (!ok) errors.push(`campo "${field.name}" deve ser ${field.type}`)
  }
  return { ok: errors.length === 0, errors }
}

/** Compatibilidade componente × template: família + capability exigida. */
export function checkComponentTemplateCompatibility(
  type: string, templateFamily: string, templateCapabilities: string[],
): ComponentValidation {
  const def = findComponent(type)
  if (!def) return { ok: false, errors: [`componente "${type}" não registrado`] }
  const errors: string[] = []
  if (def.compatibleFamilies !== 'any' && !def.compatibleFamilies.includes(templateFamily)) {
    errors.push(`componente "${type}" incompatível com família "${templateFamily}"`)
  }
  if (def.requiresCapability && !templateCapabilities.includes(def.requiresCapability)) {
    errors.push(`componente "${type}" exige capability "${def.requiresCapability}" ausente no template`)
  }
  return { ok: errors.length === 0, errors }
}
