/**
 * Registro e versionamento de templates (AB-S3-003).
 * Template possui capacidades, dependências e compatibilidade; versão antiga permanece identificável;
 * projeto fixa a versão usada; atualização exige preview e aprovação (aqui: exige manifest de preview aprovado).
 */
export const TEMPLATE_SCHEMA_VERSION = 1

export type TemplateFamily = 'editorial-revista' | 'guia-referencia' | 'blog-autoridade' | 'reviews-comparativos' | 'lifestyle' | 'comunidade' | 'produto-recomendacoes' | 'noticias-atualizacoes'

export type BlockType = 'hero' | 'intro' | 'article-grid' | 'featured-guide' | 'comparison' | 'product-recommendation' | 'newsletter' | 'faq' | 'footer'

export const CANONICAL_BLOCK_ORDER: BlockType[] = ['hero', 'intro', 'article-grid', 'featured-guide', 'comparison', 'product-recommendation', 'newsletter', 'faq', 'footer']

export type TemplateCapability = 'homepage' | 'category' | 'article' | 'newsletter-capture' | 'product-ads' | 'affiliate-disclosure' | 'comparison' | 'faq' | 'responsive-preview' | 'social-sharing'

export type TemplateDefinition = {
  templateId: string
  family: TemplateFamily
  version: string
  label: string
  description?: string
  blocks: BlockType[]
  capabilities: TemplateCapability[]
  requiresDesignSystem: string
  requiredComponentTypes: string[]
  deprecated?: boolean
  notes?: string
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    templateId: 'editorial-reference',
    family: 'guia-referencia',
    version: '1.0.0',
    label: 'Editorial Reference',
    description: 'Template editorial de referência com hierarquia de guia, comparativos e captura de newsletter.',
    blocks: ['hero', 'intro', 'article-grid', 'featured-guide', 'comparison', 'product-recommendation', 'newsletter', 'faq', 'footer'],
    capabilities: ['homepage', 'category', 'article', 'newsletter-capture', 'product-ads', 'affiliate-disclosure', 'comparison', 'faq', 'responsive-preview', 'social-sharing'],
    requiresDesignSystem: '>=0.1.0',
    requiredComponentTypes: ['hero', 'article-grid', 'comparison-table', 'product-card', 'newsletter', 'faq', 'footer'],
  },
  {
    templateId: 'authority-magazine',
    family: 'editorial-revista',
    version: '1.0.0',
    label: 'Authority Magazine',
    description: 'Revista de autoridade com destaque de pauta e grid editorial.',
    blocks: ['hero', 'intro', 'article-grid', 'featured-guide', 'newsletter', 'footer'],
    capabilities: ['homepage', 'category', 'article', 'newsletter-capture', 'responsive-preview', 'social-sharing'],
    requiresDesignSystem: '>=0.1.0',
    requiredComponentTypes: ['hero', 'article-grid', 'featured-guide', 'newsletter', 'footer'],
  },
  {
    templateId: 'reviews-showcase',
    family: 'reviews-comparativos',
    version: '1.0.0',
    label: 'Reviews Showcase',
    description: 'Foco em reviews e comparativos com fichas técnicas e product cards.',
    blocks: ['hero', 'article-grid', 'comparison', 'product-recommendation', 'faq', 'footer'],
    capabilities: ['homepage', 'category', 'article', 'product-ads', 'affiliate-disclosure', 'comparison', 'faq', 'responsive-preview'],
    requiresDesignSystem: '>=0.1.0',
    requiredComponentTypes: ['hero', 'comparison-table', 'product-card', 'faq', 'footer'],
  },
  {
    templateId: 'editorial-reference',
    family: 'guia-referencia',
    version: '0.9.0',
    label: 'Editorial Reference (pré-release)',
    deprecated: true,
    notes: 'Versão antiga mantida identificável para rollback/auditoria; não usar em projetos novos.',
    blocks: ['hero', 'intro', 'article-grid', 'newsletter', 'footer'],
    capabilities: ['homepage', 'category', 'article', 'newsletter-capture', 'responsive-preview'],
    requiredComponentTypes: ['hero', 'article-grid', 'newsletter', 'footer'],
    requiresDesignSystem: '>=0.1.0',
  },
]

const SEMVER_RE = /^\d+\.\d+\.\d+$/

export function listTemplates(opts?: { includeDeprecated?: boolean }): TemplateDefinition[] {
  return TEMPLATE_REGISTRY.filter(t => opts?.includeDeprecated ? true : !t.deprecated)
}

export function findTemplate(templateId: string, version?: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find(t => t.templateId === templateId && (version === undefined || t.version === version))
}

export function findLatestTemplate(templateId: string): TemplateDefinition | undefined {
  const all = TEMPLATE_REGISTRY.filter(t => t.templateId === templateId && !t.deprecated)
  if (all.length === 0) return undefined
  return all.reduce((a, b) => (compareSemver(a.version, b.version) >= 0 ? a : b))
}

export function compareSemver(a: string, b: string): number {
  if (!SEMVER_RE.test(a) || !SEMVER_RE.test(b)) throw new Error(`versão inválida: ${a} / ${b}`)
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

export type VersionCheck = {
  ok: boolean
  code: string
  message: string
  updateAvailable?: boolean
}

/** Projeto fixa versão; versão deprecada exige decisão explícita de update. */
export function checkTemplateVersion(templateId: string, pinnedVersion: string): VersionCheck {
  const pinned = findTemplate(templateId, pinnedVersion)
  if (!pinned) return { ok: false, code: 'TEMPLATE_NOT_FOUND', message: `template ${templateId}@${pinnedVersion} não registrado` }
  const latest = findLatestTemplate(templateId)
  const deprecated = pinned.deprecated === true
  const updateAvailable = latest ? compareSemver(latest.version, pinnedVersion) > 0 : false
  if (deprecated) {
    return { ok: false, code: 'TEMPLATE_DEPRECATED', message: `versão ${pinnedVersion} está deprecada; atualização exige preview+aprovação`, updateAvailable }
  }
  return { ok: true, code: 'OK', message: 'versão válida', updateAvailable }
}

/** Compatibilidade: template exige componentes e capacidades; ausência rejeita. */
export function checkTemplateCompatibility(t: TemplateDefinition, availableComponentTypes: string[]): { ok: boolean; missing: string[] } {
  const missing = t.requiredComponentTypes.filter(c => !availableComponentTypes.includes(c))
  return { ok: missing.length === 0, missing }
}
