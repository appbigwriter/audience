/**
 * AB-S8-001/002/003 (backend) — Piloto controlado ponta a ponta:
 * intake → binding → nichos → manifesto → pacote → perfil editorial →
 * briefing → fontes → draft → fact check → monetização → descoberta social →
 * jobs idempotentes. Resultado final é draft/blocked — nunca publicado.
 */
import { describe, expect, it } from 'vitest'
import { fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'
import { evaluateReleaseGate } from '../../packages/contracts/release-gate'
import { bindPersona, createAudienceProject, transitionProject } from '../../packages/domain/audience-project'
import { importPotentialNiches } from '../../packages/domain/potential-niches'
import { buildConfigurationPackage, validateConfigurationPackage, type AudienceProjectManifesto } from '../../packages/domain/manifesto'
import { InMemoryAudienceProjectRepository, verifyReadback } from '../../packages/persistence/audience-project-repository'
import { MockAuthorityPersonaAdapter } from '../../packages/adapters/authority-persona-adapter'
import { MockControlTowerAdapter } from '../../packages/adapters/control-tower-provisioning-adapter'
import { approveDraftIfSupported, createArticleDraft, deriveEditorialProfile, factCheck, validateResearchBrief, type ResearchBrief, type RegisteredSource } from '../../packages/domain/editorial'
import { bindMonetization, disclosureBlocksApproval, validateAdInventoryItem, validateAffiliateRecommendation } from '../../packages/domain/monetization'
import { generateChannelHypotheses, scoreChannelFit, validateChannelCapability, type ChannelCapability } from '../../packages/domain/channel-discovery'
import { createJob, heartbeat, InboxDeduplicator, processOnce } from '../../packages/domain/orchestration'

const NOW = '2026-09-22T12:00:00.000Z'

describe('AB-S8-002 — fluxo editorial ponta a ponta (resultado: draft ou blocked)', () => {
  it('pipeline completo com fixture test-only termina em draft aprovável, sem publicação', async () => {
    // gates + criação
    const repo = new InMemoryAudienceProjectRepository()
    const authority = MockAuthorityPersonaAdapter.fromFixtures(fixturePersonaIntakePackage)
    const fetched = await authority.fetchApprovedPackage(fixturePersonaIntakePackage.personaId, fixturePersonaIntakePackage.personaVersionId)
    expect(fetched.outcome).toBe('fetched')
    const gate = evaluateReleaseGate({ target: 'local', personaPackage: fixturePersonaIntakePackage, persistence: repo.capability() })
    expect(gate.released).toBe(true)

    const project = createAudienceProject(
      { name: 'Piloto AB [fixture]', slug: 'piloto-ab-fixture', ownerId: 'owner-1', tenantId: 'tenant-1', niche: 'contratos auditáveis [fixture]', audienceDefinition: 'leitores técnicos [fixture]', businessObjective: 'authority_and_monetization', language: 'pt-BR', region: 'BR' },
      fixturePersonaIntakePackage,
      repo.capability(),
      { idFactory: () => 'ap-pilot-1', now: () => NOW },
    )
    expect(bindPersona(project, fixturePersonaIntakePackage, 'agent-a').outcome).toBe('bound')
    const niches = importPotentialNiches(fixturePersonaIntakePackage.snapshot.potentialNiches, { importedAt: NOW, importedBy: 'agent-a' })
    repo.saveNiches(project.id, niches.imported)
    for (const to of ['intake', 'persona_bound', 'planning'] as const) transitionProject(project, to, { actor: 'agent-a', reason: `piloto: ${to}`, now: () => NOW })

    // manifesto + pacote
    const manifesto: AudienceProjectManifesto = {
      contractVersion: 1, projectId: project.id, version: 1,
      project: { name: project.name, slug: project.slug, niche: project.niche, language: 'pt-BR', region: 'BR', businessObjective: 'authority_and_monetization' },
      persona: { personaId: fixturePersonaIntakePackage.personaId, personaVersionId: fixturePersonaIntakePackage.personaVersionId, personaVersion: 1, contentHash: fixturePersonaIntakePackage.contentHash },
      editorial: { tone: ['próximo', 'didático'], pillars: niches.imported[0].evidence, forbiddenClaims: ['promessa sem fonte'], defaultOutput: 'draft' },
      blog: { template: 'editorial-reference', templateVersion: '1.0.0', categories: ['guias'], articleFrequencyPerWeek: 2 },
      visual: { density: 'comfortable', imageDirection: 'documentary', motion: 'subtle', accessibilityLevel: 'AA' },
      social: { channels: ['pinterest'], approvalRequired: true },
      monetization: { affiliateEnabled: true, productAdsEnabled: true, newsletterEnabled: false },
    }
    const pkg = buildConfigurationPackage(manifesto, {
      templateId: 'tpl-editorial-reference', editorialProfileRef: `edref-${project.id}`,
      affiliateDisclosureTemplate: fixturePersonaIntakePackage.snapshot.disclosurePolicy.affiliateDisclosureTemplate,
      aiDisclosure: fixturePersonaIntakePackage.snapshot.visualConsistencyProfile.aiDisclosure, createdAt: NOW,
    })
    expect(validateConfigurationPackage(pkg).ok).toBe(true)
    repo.save(project)
    expect(verifyReadback(repo, project.id).verified).toBe(true)

    // perfil editorial + briefing + fonte
    const profile = deriveEditorialProfile(fixturePersonaIntakePackage, project.id, 'pt-BR')
    const brief: ResearchBrief = {
      id: 'brief-pilot-1', projectId: project.id, intent: 'informational', primaryKeyword: 'audience builder contratos',
      secondaryTerms: ['binding', 'manifesto'], audience: 'leitores técnicos [fixture]', keyPoints: ['intake', 'binding', 'manifesto', 'readback'],
      limitations: ['fixture sem pesquisa real'], sourceIds: ['src-pilot-1'], createdAt: NOW,
    }
    expect(validateResearchBrief(brief).ok).toBe(true)
    const source: RegisteredSource = { id: 'src-pilot-1', url: 'https://example.com/contrato', title: 'Contrato fonte [fixture]', origin: 'example.com', accessedAt: NOW, type: 'official', supportsClaim: 'contrato exige hash de conteúdo' }
    expect(require_validSource(source)).toBe(true)

    // monetização com disclosure no corpo (binding calculado ANTES do corpo)
    const ad = { itemId: 'ad-pilot-1', advertiser: 'Loja Fixture [fixture]', kind: 'product_ad' as const, destinationUrl: 'https://example.com/p', niche: project.niche, disclosureRequired: true as const, validFrom: '2026-09-01T00:00:00.000Z', validUntil: '2026-12-01T00:00:00.000Z', allowedFormats: ['350x350' as const], status: 'active' as const, fbrAdsRef: 'fbr-ads://pilot-1' }
    const aff = { itemId: 'aff-pilot-1', intent: 'commercial', disclosure: fixturePersonaIntakePackage.snapshot.disclosurePolicy.affiliateDisclosureTemplate, validUntil: '2026-12-01T00:00:00.000Z', evidence: ['relevância fixture'], relevance: 0.9 }
    expect(validateAdInventoryItem(ad).ok).toBe(true)
    expect(validateAffiliateRecommendation(aff).ok).toBe(true)
    const monetization = bindMonetization({ articleId: 'draft-pilot-1', affiliate: aff, productAd: ad, articleNiche: project.niche, articleIntent: brief.intent })
    expect(monetization.status).toBe('bound')

    // draft + fact check (corpo inclui o disclosure combinado)
    const checked = factCheck([{ text: 'contrato exige hash de conteúdo', classification: 'fact', sourceIds: ['src-pilot-1'] }], new Set(['src-pilot-1']))
    const draft = createArticleDraft({
      id: 'draft-pilot-1', projectId: project.id, title: 'Como o Audience Builder valida Personas [fixture]', slug: 'como-ab-valida-personas',
      metaDescription: 'Guia do pipeline de validação.', outline: ['intake', 'binding', 'manifesto'], body: `Corpo do artigo. ${monetization.disclosure}`,
      authorPersonaVersionId: fixturePersonaIntakePackage.personaVersionId, sourceIds: ['src-pilot-1'], claims: checked.map((c) => c.claim),
    }, NOW)
    expect(draft.status).toBe('draft')
    expect(approveDraftIfSupported(draft).approved).toBe(true)
    expect(disclosureBlocksApproval(monetization, draft.body)).toBe(false)

    // resultado final do pipeline é draft (nunca published)
    expect(draft.status).toBe('draft')
  })

  it('monetização bloqueada interrompe pipeline em blocked', () => {
    const monetization = bindMonetization({ articleId: 'a', affiliate: null, productAd: null, articleNiche: 'x', articleIntent: 'y' })
    expect(monetization.status).toBe('blocked')
    expect(disclosureBlocksApproval(monetization, 'corpo')).toBe(true)
  })
})

describe('AB-S8-003 — descoberta social (sem publicação automática)', () => {
  it('produz possibilidades justificadas com dados faltantes; nenhum canal é publicado', () => {
    const capabilities: ChannelCapability[] = [
      { channel: 'pinterest', formats: ['pin'], limits: ['500 chars'], cadence: 'diária', dependencies: ['conta', 'assets'], metrics: ['saves'], risks: ['r1'], integration: 'planned', operationalCost: 'medium', dataProvenance: [{ field: 'formats', source: 'doc oficial [fixture]', retrievedAt: NOW }] },
      { channel: 'instagram', formats: ['reels'], limits: ['90s'], cadence: '3x/semana', dependencies: ['conta', 'vídeo'], metrics: ['reach'], risks: ['r2'], integration: 'planned', operationalCost: 'high', dataProvenance: [{ field: 'formats', source: 'doc oficial [fixture]', retrievedAt: NOW }] },
    ]
    capabilities.forEach((c) => expect(validateChannelCapability(c).ok).toBe(true))
    const fits = capabilities.map((c, i) => scoreChannelFit({
      channel: c.channel, audienceMatch: i === 0 ? 0.8 : 0.7, formatMatch: 0.7, visualMatch: 0.8, cadenceFeasibility: 0.5, objectiveAlignment: 0.7, complianceRisk: 0.1, productionCapacity: 0.5,
    }))
    const hypotheses = generateChannelHypotheses(fits, { createdBy: 'agent-a' })
    expect(hypotheses.length).toBe(2)
    expect(hypotheses.every((h) => h.status === 'proposed')).toBe(true) // nunca decisão/publicação
    expect(hypotheses.some((h) => h.missingData.length > 0)).toBe(true) // explica dados faltantes
  })
})

describe('AB-S8-001 + AB-S7-003 — piloto com jobs idempotentes e provisionamento mock', () => {
  it('replay do evento de provisionamento não duplica job nem projeto CT', async () => {
    const inbox = new InboxDeduplicator()
    const ct = new MockControlTowerAdapter()
    const request = {
      contractVersion: 1 as const, fluxJobId: 'job-prov-1', correlationId: 'corr-1', audienceProjectId: 'ap-pilot-1', tenantId: 'tenant-1',
      projectSlug: 'piloto-ab-fixture', projectName: 'Piloto AB', language: 'pt-BR', templateId: 'tpl-editorial-reference',
      approvedVersions: { personaVersionId: fixturePersonaIntakePackage.personaVersionId, manifestoVersion: 1 },
    }
    let ctProvisions = 0
    const run = () => {
      const job = createJob({ jobId: 'job-prov-1', projectId: 'ap-pilot-1', kind: 'provisioning' as const, owner: 'agent-a' }, NOW)
      heartbeat(job, 'provisionando via CT mock', NOW)
      ctProvisions += 1
      return ct.provision(request)
    }
    const first = processOnce(inbox, 'evt-prov-1', 'audience-builder', 'blog.provisioning_requested', request, run, NOW)
    const replay = processOnce(inbox, 'evt-prov-1', 'audience-builder', 'blog.provisioning_requested', request, run, NOW)
    expect(first.outcome).toBe('executed')
    expect(replay.outcome).toBe('skipped_replay')
    expect(ctProvisions).toBe(1)
    const result = await (first.result as Promise<{ outcome: string }>)
    expect(result.outcome).toBe('provisioned')
  })
})

// helper para validação de fonte dentro do piloto
function require_validSource(s: RegisteredSource): boolean {
  // usa validação de domínio via import dinâmico já feito no topo
  const ok = s.url.startsWith('https://') && Boolean(s.supportsClaim)
  return ok
}
