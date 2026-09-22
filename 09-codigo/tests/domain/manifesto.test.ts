/**
 * AB-S2-005 / AB-S2-006 — Manifesto validado por campo, versionado,
 * idempotente; pacote de configuração com referências (sem secrets).
 */
import { describe, expect, it } from 'vitest'
import {
  buildConfigurationPackage,
  computeManifestoHash,
  validateConfigurationPackage,
  validateManifesto,
  type AudienceProjectManifesto,
} from '../../packages/domain/manifesto'
import { cloneFixturePackage, fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'
import { computeContentHash } from '../../packages/contracts/common'

function makeManifesto(version = 1): AudienceProjectManifesto {
  return {
    contractVersion: 1,
    projectId: 'ap-test-1',
    version,
    project: {
      name: 'Projeto Fixture',
      slug: 'projeto-fixture',
      niche: 'contratos auditáveis',
      language: 'pt-BR',
      region: 'BR',
      businessObjective: 'authority_and_monetization',
    },
    persona: {
      personaId: fixturePersonaIntakePackage.personaId,
      personaVersionId: fixturePersonaIntakePackage.personaVersionId,
      personaVersion: fixturePersonaIntakePackage.personaVersion,
      contentHash: fixturePersonaIntakePackage.contentHash,
    },
    editorial: {
      tone: ['próximo', 'didático'],
      pillars: ['contratos primeiro', 'evidência antes de conclusão'],
      forbiddenClaims: ['promessa sem fonte'],
      defaultOutput: 'draft',
    },
    blog: {
      template: 'editorial-reference',
      templateVersion: '1.0.0',
      categories: ['guias', 'análises'],
      articleFrequencyPerWeek: 2,
    },
    visual: {
      density: 'comfortable',
      imageDirection: 'documentary',
      motion: 'subtle',
      accessibilityLevel: 'AA',
    },
    social: {
      channels: ['instagram', 'pinterest'],
      approvalRequired: true,
    },
    monetization: {
      affiliateEnabled: true,
      productAdsEnabled: true,
      newsletterEnabled: false,
    },
  }
}

describe('AB-S2-005 — manifesto', () => {
  it('manifesto válido passa', () => {
    expect(validateManifesto(makeManifesto()).ok).toBe(true)
  })

  it('valores inválidos retornam erros por campo', () => {
    const m = makeManifesto()
    m.project.language = 'xx-XX' as never
    m.project.region = 'Marte' as never
    m.blog.template = 'clone-qualquer' as never
    m.blog.templateVersion = '1' as never
    m.social.channels = ['telegram', 'telegram'] as never
    m.social.approvalRequired = false as never
    const r = validateManifesto(m)
    const fields = r.errors.map((e) => e.field)
    expect(fields).toContain('project.language')
    expect(fields).toContain('project.region')
    expect(fields).toContain('blog.template')
    expect(fields).toContain('blog.templateVersion')
    expect(fields).toContain('social.channels[0]')
    expect(fields).toContain('social.channels')
    expect(fields).toContain('social.approvalRequired')
  })

  it('persona com hash inválido é rejeitada por campo', () => {
    const m = makeManifesto()
    m.persona.contentHash = 'hash-frouxo'
    expect(validateManifesto(m).errors.some((e) => e.field === 'persona.contentHash')).toBe(true)
  })

  it('manifesto é versionado e hash ignora o campo version (conteúdo igual→hash igual)', () => {
    const v1 = makeManifesto(1)
    const v2 = makeManifesto(2)
    expect(computeManifestoHash(v1)).toBe(computeManifestoHash(v2))
    const v2Alt = makeManifesto(2)
    v2Alt.editorial.tone = ['formal']
    expect(computeManifestoHash(v1)).not.toBe(computeManifestoHash(v2Alt))
  })
})

describe('AB-S2-006 — pacote de configuração', () => {
  const ctx = {
    templateId: 'tpl-editorial-reference',
    editorialProfileRef: 'edref-ap-test-1',
    affiliateDisclosureTemplate: 'Contém links de afiliado. [fixture]',
    aiDisclosure: 'Conteúdo com apoio de IA. [fixture]',
    createdAt: '2026-09-22T10:00:00.000Z',
  }

  it('gera pacote válido com referências e sem secrets', () => {
    const pkg = buildConfigurationPackage(makeManifesto(), ctx)
    expect(validateConfigurationPackage(pkg).ok).toBe(true)
    const serialized = JSON.stringify(pkg)
    expect(serialized).not.toMatch(/secret|token|password|bearer/i)
    expect(pkg.references.personaId).toBe(fixturePersonaIntakePackage.personaId)
    expect(pkg.manifestoHash).toBe(computeManifestoHash(makeManifesto()))
  })

  it('manifesto inválido não gera pacote (fail-closed)', () => {
    const m = makeManifesto()
    m.visual.motion = 'turbo' as never
    expect(() => buildConfigurationPackage(m, ctx)).toThrow(/invalid manifesto/)
  })

  it('pacote adulterado falha na validação do consumidor (shape)', () => {
    const pkg = buildConfigurationPackage(makeManifesto(), ctx)
    pkg.manifestoHash = 'hash-frouxo'
    const r = validateConfigurationPackage(pkg)
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.field === 'manifestoHash' && e.code === 'INVALID_FORMAT')).toBe(true)
    pkg.manifestoHash = computeContentHash({ hack: true })
    delete (pkg.references as Record<string, unknown>).templateId
    const r2 = validateConfigurationPackage(pkg)
    expect(r2.ok).toBe(false)
    expect(r2.errors.some((e) => e.field === 'references.templateId')).toBe(true)
  })

  it('hash em formato válido mas divergente do manifesto é detectável por recálculo (correspondência)', () => {
    const m = makeManifesto()
    const pkg = buildConfigurationPackage(m, ctx)
    pkg.manifestoHash = computeContentHash({ hack: true }) // formato válido, conteúdo errado
    // validação de shape passa; correspondência é verificada recalculando
    expect(validateConfigurationPackage(pkg).ok).toBe(true)
    expect(pkg.manifestoHash === computeManifestoHash(m)).toBe(false)
  })

  it('pacote de manifesto divergente do binding é detectável via hash', () => {
    const a = buildConfigurationPackage(makeManifesto(), ctx)
    const m2 = makeManifesto()
    m2.editorial.tone = ['formal']
    const b = buildConfigurationPackage(m2, ctx)
    expect(a.manifestoHash).not.toBe(b.manifestoHash)
  })
})
