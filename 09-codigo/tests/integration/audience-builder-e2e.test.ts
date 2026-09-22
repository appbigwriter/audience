/**
 * Integração local E2E do fluxo backend do Audience Builder (S0→S2).
 *
 * intake (fixture testOnly) → gate → criação do projeto → binding →
 * nichos → transições → manifesto → pacote de configuração → persistência
 * com readback verificado.
 *
 * IMPORTANTE: este teste usa SOMENTE fixtures locais; não prova integração
 * real com Authority (permanece `pendente` — bloqueios B1–B4).
 */
import { describe, expect, it } from 'vitest'
import { fixturePersonaIntakePackage, cloneFixturePackage } from '../../packages/contracts/persona-fixtures'
import { evaluateReleaseGate } from '../../packages/contracts/release-gate'
import { bindPersona, createAudienceProject, transitionProject } from '../../packages/domain/audience-project'
import { importPotentialNiches } from '../../packages/domain/potential-niches'
import { buildConfigurationPackage, validateConfigurationPackage, validateManifesto, type AudienceProjectManifesto } from '../../packages/domain/manifesto'
import { InMemoryAudienceProjectRepository, verifyReadback } from '../../packages/persistence/audience-project-repository'
import { MockAuthorityPersonaAdapter } from '../../packages/adapters/authority-persona-adapter'

describe('E2E local — intake até pacote de configuração com readback', () => {
  it('fluxo completo feliz, com fixture test-only e readback verificado', async () => {
    // 1) Autoridade (mock) entrega o pacote aprovado
    const authority = MockAuthorityPersonaAdapter.fromFixtures(fixturePersonaIntakePackage)
    const fetched = await authority.fetchApprovedPackage(fixturePersonaIntakePackage.personaId, fixturePersonaIntakePackage.personaVersionId)
    expect(fetched.outcome).toBe('fetched')

    // 2) Gate local liberado
    const repo = new InMemoryAudienceProjectRepository()
    const gate = evaluateReleaseGate({ target: 'local', personaPackage: fixturePersonaIntakePackage, persistence: repo.capability() })
    expect(gate.released).toBe(true)

    // 3) Criação + binding + nichos
    const project = createAudienceProject(
      {
        name: 'Projeto Cinema [fixture]',
        slug: 'projeto-cinema-fixture',
        ownerId: 'owner-1',
        tenantId: 'tenant-1',
        niche: 'contratos auditáveis [fixture]',
        audienceDefinition: 'leitores de teste [fixture]',
        businessObjective: 'authority_and_monetization',
        language: 'pt-BR',
        region: 'BR',
      },
      fixturePersonaIntakePackage,
      repo.capability(),
      { idFactory: () => 'ap-e2e-1', now: () => '2026-09-22T10:00:00.000Z' },
    )
    const bound = bindPersona(project, fixturePersonaIntakePackage, 'agent-a')
    expect(bound.outcome).toBe('bound')
    const niches = importPotentialNiches(fixturePersonaIntakePackage.snapshot.potentialNiches, { importedAt: '2026-09-22T10:05:00.000Z', importedBy: 'agent-a' })
    repo.saveNiches(project.id, niches.imported)

    // 4) Transições com evidência
    for (const to of ['intake', 'persona_bound', 'planning'] as const) {
      transitionProject(project, to, { actor: 'agent-a', reason: `avanço para ${to}` })
    }

    // 5) Manifesto derivado do binding (hash da persona preservado)
    const manifesto: AudienceProjectManifesto = {
      contractVersion: 1,
      projectId: project.id,
      version: 1,
      project: {
        name: project.name,
        slug: project.slug,
        niche: project.niche,
        language: 'pt-BR',
        region: 'BR',
        businessObjective: 'authority_and_monetization',
      },
      persona: {
        personaId: project.personaBinding!.personaId,
        personaVersionId: project.personaBinding!.personaVersionId,
        personaVersion: project.personaBinding!.personaVersion,
        contentHash: project.personaBinding!.contentHash,
      },
      editorial: {
        tone: ['próximo', 'didático'],
        pillars: fixturePersonaIntakePackage.snapshot.editorialProfile.editorialPillars,
        forbiddenClaims: ['promessa sem fonte'],
        defaultOutput: 'draft',
      },
      blog: { template: 'editorial-reference', templateVersion: '1.0.0', categories: ['guias'], articleFrequencyPerWeek: 2 },
      visual: { density: 'comfortable', imageDirection: 'documentary', motion: 'subtle', accessibilityLevel: 'AA' },
      social: { channels: ['instagram', 'pinterest'], approvalRequired: true },
      monetization: { affiliateEnabled: true, productAdsEnabled: true, newsletterEnabled: false },
    }
    expect(validateManifesto(manifesto).ok).toBe(true)

    // 6) Pacote de configuração validado por consumidor
    const pkg = buildConfigurationPackage(manifesto, {
      templateId: 'tpl-editorial-reference',
      editorialProfileRef: `edref-${project.id}`,
      affiliateDisclosureTemplate: fixturePersonaIntakePackage.snapshot.disclosurePolicy.affiliateDisclosureTemplate,
      aiDisclosure: fixturePersonaIntakePackage.snapshot.visualConsistencyProfile.aiDisclosure,
      createdAt: '2026-09-22T10:10:00.000Z',
    })
    expect(validateConfigurationPackage(pkg).ok).toBe(true)
    expect(pkg.references.personaContentHash).toBe(fixturePersonaIntakePackage.contentHash)

    // 7) Persistência + readback
    const saveOutcome = repo.save(project)
    expect(saveOutcome.outcome).toBe('saved')
    const readback = verifyReadback(repo, project.id)
    expect(readback.verified).toBe(true)
    expect(readback.details.personaBinding).toMatchObject({ personaVersionId: fixturePersonaIntakePackage.personaVersionId })
    expect(repo.getNiches(project.id)).toHaveLength(1)

    // 8) Replay idempotente do binding não duplica
    const replay = bindPersona(repo.findById(project.id)!, fixturePersonaIntakePackage, 'agent-a')
    expect(replay.outcome).toBe('replay')

    // 9) Duplicidade slug/owner bloqueada (id novo, mesmo tenant/owner/slug)
    const twin = createAudienceProject(
      { ...project, id: undefined, name: 'Gêmeo' },
      fixturePersonaIntakePackage,
      repo.capability(),
      { idFactory: () => 'ap-e2e-2', now: () => '2026-09-22T10:15:00.000Z' },
    )
    expect(twin.id).toBe('ap-e2e-2')
    expect(repo.save(twin).outcome).toBe('duplicate')

    // 10) Isolamento de tenant
    const other = repo.listByTenant('tenant-outro')
    expect(other).toHaveLength(0)
  })

  it('pacote não aprovado interrompe o fluxo no início (fail-closed em duas camadas)', async () => {
    const stale = cloneFixturePackage()
    stale.status = 'stale'
    const authority = new MockAuthorityPersonaAdapter(new Map([['x@1', stale]]))
    const fetched = await authority.fetchApprovedPackage('x', '1')
    // camada 1: o próprio adapter recusa pacote não aprovado
    expect(fetched.outcome).toBe('invalid')
    // camada 2: mesmo que chegasse, o gate reprova
    const repo = new InMemoryAudienceProjectRepository()
    const gate = evaluateReleaseGate({ target: 'local', personaPackage: stale, persistence: repo.capability() })
    expect(gate.released).toBe(false)
  })

  it('persona inexistente na autoridade não cria nada', async () => {
    const authority = MockAuthorityPersonaAdapter.fromFixtures()
    const fetched = await authority.fetchApprovedPackage('não-existe', 'v99')
    expect(fetched.outcome).toBe('not_found')
  })
})

describe('Autoridade real permanece pendente (sem readback externo)', () => {
  it('adapter real não configurado reporta integration_pending, não inventa resposta', async () => {
    const adapter = new (await import('../../packages/adapters/authority-persona-adapter')).RealAuthorityPersonaAdapter({
      baseUrl: '',
      approvedPackagePath: '',
      bearerToken: '',
    })
    const out = await adapter.fetchApprovedPackage('p', 'v')
    expect(out.outcome).toBe('integration_pending')
    if (out.outcome === 'integration_pending') expect(out.reason).toBe('AUTHORITY_ADAPTER_NOT_CONFIGURED')
  })
})
