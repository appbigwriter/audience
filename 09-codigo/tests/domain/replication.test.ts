/**
 * SPRINT S9 backend — blueprint, replicação idempotente/isolada, portfólio.
 */
import { describe, expect, it } from 'vitest'
import { buildPortfolioReport, getDefaultBlueprint, replicateFromManifesto } from '../../packages/domain/replication'
import type { AudienceProjectManifesto } from '../../packages/domain/manifesto'

function makeManifesto(version = 1): AudienceProjectManifesto {
  return {
    contractVersion: 1,
    projectId: 'ap-test-1',
    version,
    project: { name: 'Projeto Fixture', slug: 'projeto-fixture', niche: 'contratos auditáveis', language: 'pt-BR', region: 'BR', businessObjective: 'authority_and_monetization' },
    persona: { personaId: 'fixture-persona-ab-001', personaVersionId: 'fixture-persona-ab-001@v1', personaVersion: 1, contentHash: `sha256:${'b'.repeat(64)}` },
    editorial: { tone: ['próximo'], pillars: ['p1'], forbiddenClaims: ['promessa sem fonte'], defaultOutput: 'draft' },
    blog: { template: 'editorial-reference', templateVersion: '1.0.0', categories: ['guias'], articleFrequencyPerWeek: 2 },
    visual: { density: 'comfortable', imageDirection: 'documentary', motion: 'subtle', accessibilityLevel: 'AA' },
    social: { channels: ['pinterest'], approvalRequired: true },
    monetization: { affiliateEnabled: true, productAdsEnabled: true, newsletterEnabled: false },
  }
}

describe('AB-S9-001 — blueprint', () => {
  it('blueprint define entradas, validações, jobs, Gates, outputs e rollback', () => {
    const bp = getDefaultBlueprint()
    expect(bp.steps.length).toBeGreaterThanOrEqual(7)
    expect(bp.steps.every((s) => s.validations.length >= 1 && s.outputs.length >= 1)).toBe(true)
    const provisioning = bp.steps.find((s) => s.jobKind === 'provisioning')!
    expect(provisioning.gate).toContain('Sergio')
    expect(bp.finalGates).toContain('G-publicação (Sergio)')
  })
})

describe('AB-S9-002 — provisionamento repetível', () => {
  const existing = [{ id: 'ap-1', tenantId: 'tenant-1', ownerId: 'owner-1', slug: 'projeto-fixture' }]

  it('segundo projeto por manifesto é criado sem copiar código', () => {
    const m = makeManifesto(1)
    m.project.slug = 'segundo-nicho'
    const out = replicateFromManifesto({ manifesto: m }, existing, { tenantId: 'tenant-1', ownerId: 'owner-1', idFactory: () => 'ap-2' })
    expect(out.outcome).toBe('created')
    if (out.outcome === 'created') expect(out.projectId).toBe('ap-2')
  })

  it('mesmo slug/owner/tenant é duplicate (idempotente)', () => {
    const m = makeManifesto(1)
    const out = replicateFromManifesto({ manifesto: m }, existing, { tenantId: 'tenant-1', ownerId: 'owner-1', idFactory: () => 'ap-x' })
    expect(out.outcome).toBe('duplicate')
  })

  it('tenant diferente é isolado (mesmo slug cria)', () => {
    const m = makeManifesto(1)
    const out = replicateFromManifesto({ manifesto: m }, existing, { tenantId: 'tenant-2', ownerId: 'owner-9', idFactory: () => 'ap-3' })
    expect(out.outcome).toBe('created')
  })

  it('manifesto inválido bloqueia replicação', () => {
    const m = makeManifesto(1)
    m.project.language = 'xx' as never
    const out = replicateFromManifesto({ manifesto: m }, [], { tenantId: 't', ownerId: 'o', idFactory: () => 'ap-4' })
    expect(out.outcome).toBe('invalid_manifesto')
  })
})

describe('AB-S9-005 — relatório de portfólio', () => {
  const projects = [
    { id: 'ap-1', slug: 'piloto', tenantId: 't1', status: 'active', transitions: [{ at: '2026-09-22T00:00:00.000Z', to: 'active' }], isPilot: true },
    { id: 'ap-2', slug: 'bloqueado', tenantId: 't1', status: 'blocked', transitions: [], blockers: ['B1 Authority API'] },
    { id: 'ap-3', slug: 'producao', tenantId: 't1', status: 'active', transitions: [{ at: '2026-09-22T00:00:00.000Z', to: 'active' }], productionReadbackVerified: true },
    { id: 'ap-4', slug: 'staging', tenantId: 't1', status: 'planning', transitions: [] },
  ]

  it('separa piloto, bloqueado, produção verificada e staging', () => {
    const r = buildPortfolioReport(projects)
    expect(r.total).toBe(4)
    expect(r.byCategory).toEqual({ pilot: 1, blocked: 1, production_verified: 1, staging: 1 })
    const blocked = r.projects.find((p) => p.slug === 'bloqueado')!
    expect(blocked.blockers).toContain('B1 Authority API')
  })

  it('produção sem readback NUNCA é production_verified', () => {
    const r = buildPortfolioReport([{ id: 'x', slug: 'sem-readback', tenantId: 't', status: 'active', transitions: [{ at: '2026-09-22T00:00:00.000Z', to: 'active' }] }])
    expect(r.projects[0].category).not.toBe('production_verified')
  })
})
