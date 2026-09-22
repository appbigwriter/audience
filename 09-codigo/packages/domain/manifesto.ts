/**
 * AB-S2-005 — Schema e validação do manifesto do Audience Project.
 *
 * - valida linguagem, região, nicho, template, editorial, social e monetização;
 * - valores inválidos retornam erros POR CAMPO;
 * - manifesto é versionado;
 * - reprocessamento idempotente preserva a versão.
 *
 * AB-S2-006 — pacote de configuração derivado do manifesto:
 * - inclui referências, não secrets;
 * - contém versão do manifesto e hash;
 * - consumidores validam o pacote (`validateConfigurationPackage`);
 * - pacote inválido não é publicado.
 */
import { computeContentHash, FieldValidator, isCanonicalHash, type CanonicalHash, type ValidationResult } from '../contracts/common'

export const MANIFESTO_CONTRACT_VERSION = 1

export const MANIFESTO_LANGUAGES = ['pt-BR', 'en-US'] as const
export const MANIFESTO_REGIONS = ['BR', 'US', 'global'] as const
export const MANIFESTO_TEMPLATES = ['editorial-reference', 'guide-hub', 'review-compare'] as const
export const MANIFESTO_DENSITIES = ['compact', 'comfortable', 'spacious'] as const
export const MANIFESTO_MOTION = ['none', 'subtle', 'expressive'] as const
export const MANIFESTO_ACCESSIBILITY_LEVELS = ['AA', 'AAA'] as const
export const MANIFESTO_BUSINESS_OBJECTIVES = ['authority_and_monetization', 'authority_only', 'monetization_first'] as const
/** Canais sociais válidos no manifesto (domínio conhecido, não decisão). */
export const MANIFESTO_SOCIAL_CHANNELS = ['instagram', 'pinterest', 'tiktok', 'youtube', 'x', 'linkedin', 'newsletter'] as const

export type ManifestoLanguage = (typeof MANIFESTO_LANGUAGES)[number]
export type ManifestoRegion = (typeof MANIFESTO_REGIONS)[number]
export type ManifestoTemplate = (typeof MANIFESTO_TEMPLATES)[number]
export type ManifestoSocialChannel = (typeof MANIFESTO_SOCIAL_CHANNELS)[number]

export type AudienceProjectManifesto = {
  contractVersion: number
  projectId: string
  version: number
  project: {
    name: string
    slug: string
    niche: string
    language: ManifestoLanguage
    region: ManifestoRegion
    businessObjective: (typeof MANIFESTO_BUSINESS_OBJECTIVES)[number]
  }
  persona: {
    personaId: string
    personaVersionId: string
    personaVersion: number
    contentHash: string
  }
  editorial: {
    tone: string[]
    pillars: string[]
    forbiddenClaims: string[]
    defaultOutput: 'draft' | 'blocked'
  }
  blog: {
    template: ManifestoTemplate
    templateVersion: string
    categories: string[]
    articleFrequencyPerWeek: number
  }
  visual: {
    density: (typeof MANIFESTO_DENSITIES)[number]
    imageDirection: string
    motion: (typeof MANIFESTO_MOTION)[number]
    accessibilityLevel: (typeof MANIFESTO_ACCESSIBILITY_LEVELS)[number]
  }
  social: {
    channels: ManifestoSocialChannel[]
    approvalRequired: true
  }
  monetization: {
    affiliateEnabled: boolean
    productAdsEnabled: boolean
    newsletterEnabled: boolean
  }
}

export function validateManifesto(m: Partial<AudienceProjectManifesto> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!m || typeof m !== 'object') {
    v.add('manifesto', 'REQUIRED', 'manifesto is required')
    return v.result()
  }
  if (m.contractVersion !== MANIFESTO_CONTRACT_VERSION) v.add('contractVersion', 'UNSUPPORTED_CONTRACT_VERSION', `expected ${MANIFESTO_CONTRACT_VERSION}`)
  v.require('projectId', m.projectId)
  if (!Number.isFinite(m.version) || (m.version ?? 0) < 1) v.add('version', 'INVALID_VERSION', 'manifesto version must be >= 1')
  const p = m.project
  if (!p) v.add('project', 'REQUIRED', 'project section is required')
  else {
    v.require('project.name', p.name)
    if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) v.add('project.slug', 'INVALID_SLUG', 'slug must be lowercase-hyphen')
    v.require('project.niche', p.niche)
    v.enum('project.language', p.language, MANIFESTO_LANGUAGES)
    v.enum('project.region', p.region, MANIFESTO_REGIONS)
    v.enum('project.businessObjective', p.businessObjective, MANIFESTO_BUSINESS_OBJECTIVES)
  }
  const persona = m.persona
  if (!persona) v.add('persona', 'REQUIRED', 'persona section is required')
  else {
    v.require('persona.personaId', persona.personaId)
    v.require('persona.personaVersionId', persona.personaVersionId)
    if (!Number.isFinite(persona.personaVersion) || (persona.personaVersion ?? 0) < 1) v.add('persona.personaVersion', 'INVALID_VERSION', 'must be >= 1')
    if (!persona.contentHash || !isCanonicalHash(persona.contentHash)) v.add('persona.contentHash', 'INVALID_FORMAT', 'expected sha256:<64hex>')
  }
  const e = m.editorial
  if (!e) v.add('editorial', 'REQUIRED', 'editorial section is required')
  else {
    v.requireNonEmptyArray('editorial.tone', e.tone)
    v.requireNonEmptyArray('editorial.pillars', e.pillars)
    v.requireNonEmptyArray('editorial.forbiddenClaims', e.forbiddenClaims)
    if (e.defaultOutput !== 'draft' && e.defaultOutput !== 'blocked') v.add('editorial.defaultOutput', 'INVALID_VALUE', "must be 'draft' or 'blocked'")
  }
  const b = m.blog
  if (!b) v.add('blog', 'REQUIRED', 'blog section is required')
  else {
    v.enum('blog.template', b.template, MANIFESTO_TEMPLATES)
    if (!b.templateVersion || !/^\d+\.\d+\.\d+$/.test(b.templateVersion)) v.add('blog.templateVersion', 'INVALID_SEMVER', 'expected semver x.y.z')
    v.requireNonEmptyArray('blog.categories', b.categories)
    if (!Number.isFinite(b.articleFrequencyPerWeek) || (b.articleFrequencyPerWeek ?? 0) < 1 || (b.articleFrequencyPerWeek ?? 0) > 14) {
      v.add('blog.articleFrequencyPerWeek', 'INVALID_RANGE', 'must be within [1,14]')
    }
  }
  const vis = m.visual
  if (!vis) v.add('visual', 'REQUIRED', 'visual section is required')
  else {
    v.enum('visual.density', vis.density, MANIFESTO_DENSITIES)
    v.require('visual.imageDirection', vis.imageDirection)
    v.enum('visual.motion', vis.motion, MANIFESTO_MOTION)
    v.enum('visual.accessibilityLevel', vis.accessibilityLevel, MANIFESTO_ACCESSIBILITY_LEVELS)
  }
  const soc = m.social
  if (!soc) v.add('social', 'REQUIRED', 'social section is required')
  else {
    if (!Array.isArray(soc.channels) || soc.channels.length === 0) v.add('social.channels', 'REQUIRED_NON_EMPTY', 'at least one channel is required')
    else {
      soc.channels.forEach((c, i) => {
        if (!(MANIFESTO_SOCIAL_CHANNELS as readonly string[]).includes(c)) v.add(`social.channels[${i}]`, 'INVALID_CHANNEL', `unknown channel: ${String(c)}`)
      })
      if (new Set(soc.channels).size !== soc.channels.length) v.add('social.channels', 'DUPLICATE_CHANNEL', 'channels must be unique')
    }
    if (soc.approvalRequired !== true) v.add('social.approvalRequired', 'INVALID_VALUE', 'must be true — publication always requires Gate')
  }
  const mon = m.monetization
  if (!mon) v.add('monetization', 'REQUIRED', 'monetization section is required')
  else {
    for (const f of ['affiliateEnabled', 'productAdsEnabled', 'newsletterEnabled'] as const) {
      if (typeof mon[f] !== 'boolean') v.add(`monetization.${f}`, 'INVALID_TYPE', 'must be boolean')
    }
  }
  return v.result()
}

// ---------------------------------------------------------------------------
// AB-S2-006 — Configuration Package
// ---------------------------------------------------------------------------

export const CONFIG_PACKAGE_CONTRACT_VERSION = 1

export type ConfigurationPackage = {
  contractVersion: number
  packageId: string
  projectId: string
  manifestoVersion: number
  manifestoHash: CanonicalHash
  createdAt: string
  /** Referências consumíveis (IDs), nunca secrets. */
  references: {
    personaId: string
    personaVersionId: string
    personaContentHash: string
    templateId: string
    templateVersion: string
    editorialProfileRef: string
    channelPlanVersionIds: { blog: string; social: string; youtube: string }
  }
  /** Resumo sanitizado — consumível por Blog/Template Engine/Social Engine. */
  derived: {
    language: ManifestoLanguage
    region: ManifestoRegion
    niche: string
    tones: string[]
    categories: string[]
    accessibilityLevel: string
    disclosureTemplates: { affiliate: string; ai: string }
  }
}

export function computeManifestoHash(m: AudienceProjectManifesto): CanonicalHash {
  const { version: _v, ...rest } = m
  return computeContentHash(rest)
}

/** Gera pacote a partir de manifesto VÁLIDO. Lança se inválido (fail-closed). */
export function buildConfigurationPackage(
  m: AudienceProjectManifesto,
  ctx: { templateId: string; editorialProfileRef: string; affiliateDisclosureTemplate: string; aiDisclosure: string; createdAt: string; packageId?: string },
): ConfigurationPackage {
  const validation = validateManifesto(m)
  if (!validation.ok) {
    throw new Error(`cannot build configuration package from invalid manifesto: ${JSON.stringify(validation.errors)}`)
  }
  const manifestoHash = computeManifestoHash(m)
  return {
    contractVersion: CONFIG_PACKAGE_CONTRACT_VERSION,
    packageId: ctx.packageId ?? `pkg-${manifestoHash.slice(7, 19)}`,
    projectId: m.projectId,
    manifestoVersion: m.version,
    manifestoHash,
    createdAt: ctx.createdAt,
    references: {
      personaId: m.persona.personaId,
      personaVersionId: m.persona.personaVersionId,
      personaContentHash: m.persona.contentHash,
      templateId: ctx.templateId,
      templateVersion: m.blog.templateVersion,
      editorialProfileRef: ctx.editorialProfileRef,
      channelPlanVersionIds: { blog: `blog-${m.persona.personaVersionId}`, social: `social-${m.persona.personaVersionId}`, youtube: `youtube-${m.persona.personaVersionId}` },
    },
    derived: {
      language: m.project.language,
      region: m.project.region,
      niche: m.project.niche,
      tones: [...m.editorial.tone],
      categories: [...m.blog.categories],
      accessibilityLevel: m.visual.accessibilityLevel,
      disclosureTemplates: { affiliate: ctx.affiliateDisclosureTemplate, ai: ctx.aiDisclosure },
    },
  }
}

/** Consumidores validam o pacote (integridade + shape). */
export function validateConfigurationPackage(pkg: Partial<ConfigurationPackage> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!pkg || typeof pkg !== 'object') {
    v.add('package', 'REQUIRED', 'configuration package is required')
    return v.result()
  }
  if (pkg.contractVersion !== CONFIG_PACKAGE_CONTRACT_VERSION) v.add('contractVersion', 'UNSUPPORTED_CONTRACT_VERSION', `expected ${CONFIG_PACKAGE_CONTRACT_VERSION}`)
  v.require('packageId', pkg.packageId)
  v.require('projectId', pkg.projectId)
  if (!Number.isFinite(pkg.manifestoVersion) || (pkg.manifestoVersion ?? 0) < 1) v.add('manifestoVersion', 'INVALID_VERSION', 'must be >= 1')
  if (!pkg.manifestoHash || !isCanonicalHash(pkg.manifestoHash)) v.add('manifestoHash', 'INVALID_FORMAT', 'expected sha256:<64hex>')
  v.require('createdAt', pkg.createdAt)
  if (!pkg.references) v.add('references', 'REQUIRED', 'references section is required')
  else {
    v.require('references.personaId', pkg.references.personaId)
    v.require('references.personaVersionId', pkg.references.personaVersionId)
    if (!pkg.references.personaContentHash || !isCanonicalHash(pkg.references.personaContentHash)) v.add('references.personaContentHash', 'INVALID_FORMAT', 'expected sha256:<64hex>')
    v.require('references.templateId', pkg.references.templateId)
    if (!pkg.references.templateVersion || !/^\d+\.\d+\.\d+$/.test(pkg.references.templateVersion)) v.add('references.templateVersion', 'INVALID_SEMVER', 'expected semver')
    v.require('references.editorialProfileRef', pkg.references.editorialProfileRef)
    for (const ch of ['blog', 'social', 'youtube'] as const) v.require(`references.channelPlanVersionIds.${ch}`, pkg.references.channelPlanVersionIds?.[ch])
  }
  if (!pkg.derived) v.add('derived', 'REQUIRED', 'derived section is required')
  else {
    v.enum('derived.language', pkg.derived.language, MANIFESTO_LANGUAGES)
    v.enum('derived.region', pkg.derived.region, MANIFESTO_REGIONS)
    v.require('derived.niche', pkg.derived.niche)
    v.requireNonEmptyArray('derived.tones', pkg.derived.tones)
    v.requireNonEmptyArray('derived.categories', pkg.derived.categories)
    v.enum('derived.accessibilityLevel', pkg.derived.accessibilityLevel as never, MANIFESTO_ACCESSIBILITY_LEVELS)
    v.require('derived.disclosureTemplates.affiliate', pkg.derived.disclosureTemplates?.affiliate)
    v.require('derived.disclosureTemplates.ai', pkg.derived.disclosureTemplates?.ai)
  }
  return v.result()
}
