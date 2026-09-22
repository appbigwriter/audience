/**
 * AB-S2-001..004 — Domínio Audience Project: criação com gate, binding,
 * transições, duplicidade e nichos potenciais.
 */
import { describe, expect, it } from 'vitest'
import {
  AudienceProjectDomainError,
  bindPersona,
  createAudienceProject,
  isDuplicateProject,
  publicationRequiresExternalGate,
  transitionProject,
  validateSlug,
} from '../../packages/domain/audience-project'
import { cloneFixturePackage, fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'
import { InMemoryAudienceProjectRepository } from '../../packages/persistence/audience-project-repository'
import { allowedTransitionsFrom } from '../../packages/contracts/audience-project-states'
import { AudienceBuilderContractError } from '../../packages/contracts/common'
import { importPotentialNiches, proposeTopCandidate, reclassifyNiche } from '../../packages/domain/potential-niches'

const persistence = new InMemoryAudienceProjectRepository().capability()

const baseInput = {
  name: 'Projeto Fixture [fixture]',
  slug: 'projeto-fixture',
  ownerId: 'owner-1',
  tenantId: 'tenant-1',
  niche: 'contratos auditáveis [fixture]',
  audienceDefinition: 'leitores de teste [fixture]',
  businessObjective: 'authority_and_monetization',
  language: 'pt-BR',
  region: 'BR',
}

function makeProject() {
  return createAudienceProject(baseInput, fixturePersonaIntakePackage, persistence, {
    idFactory: () => 'ap-test-1',
    now: () => '2026-09-22T10:00:00.000Z',
  })
}

describe('AB-S2-001 — criação de Audience Project', () => {
  it('exige Persona validada: rejeita pacote não aprovado', () => {
    const pkg = cloneFixturePackage()
    pkg.status = 'draft'
    expect(() => createAudienceProject(baseInput, pkg, persistence)).toThrow(AudienceProjectDomainError)
  })

  it('rejeita slug inválido', () => {
    for (const slug of ['', 'AB', 'a', 'two words', 'x'.repeat(65)]) {
      expect(validateSlug(slug)).toBe(false)
    }
    expect(validateSlug('abc-def')).toBe(true)
  })

  it('exige campos obrigatórios', () => {
    try {
      createAudienceProject({ ...baseInput, name: '' }, fixturePersonaIntakePackage, persistence)
      expect.unreachable('should have thrown')
    } catch (e) {
      expect((e as AudienceProjectDomainError).code).toBe('REQUIRED_FIELD')
    }
  })

  it('nasce em draft, version 1, sem binding', () => {
    const p = makeProject()
    expect(p.status).toBe('draft')
    expect(p.version).toBe(1)
    expect(p.personaBinding).toBeNull()
  })

  it('bloqueia criação quando gate de produção encontra fixture', () => {
    try {
      createAudienceProject(baseInput, fixturePersonaIntakePackage, persistence, { target: 'production' })
      expect.unreachable('should have thrown')
    } catch (e) {
      expect((e as AudienceProjectDomainError).code).toBe('RELEASE_GATE_BLOCKED')
    }
  })

  it('duplicidade owner+slug detectada', () => {
    expect(isDuplicateProject({ ownerId: 'o', slug: 's' }, { ownerId: 'o', slug: 's' })).toBe(true)
    expect(isDuplicateProject({ ownerId: 'o', slug: 's' }, { ownerId: 'p', slug: 's' })).toBe(false)
  })
})

describe('AB-S2-003 — binding de Persona', () => {
  it('grava persona_id, versão e hash; readback retorna os mesmos valores', () => {
    const project = makeProject()
    const outcome = bindPersona(project, fixturePersonaIntakePackage, 'agent-a')
    expect(outcome.outcome).toBe('bound')
    const repo = new InMemoryAudienceProjectRepository()
    repo.save(project)
    const read = repo.findById(project.id)
    expect(read?.personaBinding?.personaId).toBe(fixturePersonaIntakePackage.personaId)
    expect(read?.personaBinding?.personaVersionId).toBe(fixturePersonaIntakePackage.personaVersionId)
    expect(read?.personaBinding?.contentHash).toBe(fixturePersonaIntakePackage.contentHash)
  })

  it('replay idempotente com mesma versão+hash', () => {
    const project = makeProject()
    bindPersona(project, fixturePersonaIntakePackage, 'agent-a')
    const second = bindPersona(project, fixturePersonaIntakePackage, 'agent-a')
    expect(second.outcome).toBe('replay')
  })

  it('versão stale é rejeitada', () => {
    const project = makeProject()
    bindPersona(project, fixturePersonaIntakePackage, 'actor')
    const pkg2 = cloneFixturePackage()
    pkg2.personaVersionId = 'fixture-persona-ab-001@v2'
    pkg2.personaVersion = 2
    pkg2.approval.approvedVersions = ['fixture-persona-ab-001@v2']
    const out = bindPersona(project, pkg2, 'actor')
    // nova versão exige novo binding/aprovação — domínio sinaliza, não sobrescreve
    expect(['stale_version', 'divergent']).toContain(out.outcome)
  })

  it('hash divergente na mesma versão bloqueia', () => {
    const project = makeProject()
    bindPersona(project, fixturePersonaIntakePackage, 'actor')
    const tampered = cloneFixturePackage()
    tampered.snapshot.characterBible.name = 'Alterado [fixture]'
    tampered.contentHash = fixturePersonaIntakePackage.contentHash // hash antigo com conteúdo novo
    const out = bindPersona(project, tampered, 'actor')
    expect(out.outcome).toBe('divergent')
    expect(project.personaBinding?.contentHash).toBe(fixturePersonaIntakePackage.contentHash)
  })

  it('persona não aprovada é rejeitada no binding', () => {
    const project = makeProject()
    const pkg = cloneFixturePackage()
    pkg.status = 'rejected'
    expect(bindPersona(project, pkg, 'actor').outcome).toBe('rejected')
  })
})

describe('AB-S1-005 — transições de estado', () => {
  it('fluxo válido completo draft→intake→persona_bound→planning→provisioning→active', () => {
    const p = makeProject()
    for (const to of ['intake', 'persona_bound', 'planning', 'provisioning', 'active'] as const) {
      transitionProject(p, to, { actor: 'agent-a', reason: `transição para ${to}` })
    }
    expect(p.status).toBe('active')
    expect(p.transitions).toHaveLength(5)
    expect(p.transitions.every((t) => t.actor && t.reason && t.at)).toBe(true)
  })

  it('transição inválida falha (draft → active)', () => {
    const p = makeProject()
    try {
      transitionProject(p, 'active', { actor: 'x', reason: 'pular etapas' })
      expect.unreachable('should have thrown')
    } catch (e) {
      expect((e as AudienceBuilderContractError).code).toBe('INVALID_TRANSITION')
    }
  })

  it('archived é terminal', () => {
    const p = makeProject()
    transitionProject(p, 'archived', { actor: 'x', reason: 'fim' })
    expect(allowedTransitionsFrom('archived')).toEqual([])
    expect(() => transitionProject(p, 'draft', { actor: 'x', reason: 'reviver' })).toThrowError(AudienceBuilderContractError)
  })

  it('bloqueio não pula direto para active', () => {
    const p = makeProject()
    transitionProject(p, 'intake', { actor: 'a', reason: 'r' })
    transitionProject(p, 'blocked', { actor: 'a', reason: 'problema' })
    expect(() => transitionProject(p, 'active', { actor: 'a', reason: 'pular' })).toThrowError(AudienceBuilderContractError)
    transitionProject(p, 'planning', { actor: 'a', reason: 'desbloqueado' })
  })

  it('evidência obrigatória: actor e reason', () => {
    const p = makeProject()
    expect(() => transitionProject(p, 'intake', { actor: '', reason: '' })).toThrowError(AudienceBuilderContractError)
  })

  it('publicação não é consequência automática de active', () => {
    const p = makeProject()
    for (const to of ['intake', 'persona_bound', 'planning', 'provisioning', 'active'] as const) transitionProject(p, to, { actor: 'a', reason: 'r' })
    const pub = publicationRequiresExternalGate(p)
    expect(pub.publicationAllowed).toBe(false)
    expect(pub.gate).toBe('sergio-approval')
  })
})

describe('AB-S2-004 — nichos potenciais', () => {
  it('importa como under_analysis + hypothesis com origem/data/confiança/limitações', () => {
    const result = importPotentialNiches(fixturePersonaIntakePackage.snapshot.potentialNiches, { importedAt: '2026-09-22T00:00:00.000Z', importedBy: 'agent-a' })
    expect(result.imported).toHaveLength(1)
    expect(result.imported[0].classification).toBe('under_analysis')
    expect(result.imported[0].kind).toBe('hypothesis')
    expect(result.imported[0].limitations.length).toBeGreaterThan(0)
    expect(result.skipped).toEqual([])
  })

  it('pula nico sem id, confiança inválida ou sem limitações', () => {
    const bad = [
      { ...fixturePersonaIntakePackage.snapshot.potentialNiches[0], nicheId: '' },
      { ...fixturePersonaIntakePackage.snapshot.potentialNiches[0], confidence: 2 },
      { ...fixturePersonaIntakePackage.snapshot.potentialNiches[0], limitations: [] },
    ]
    const result = importPotentialNiches(bad as never, { importedAt: '2026-09-22T00:00:00.000Z', importedBy: 'a' })
    expect(result.imported).toHaveLength(0)
    expect(result.skipped.map((s) => s.reason)).toEqual(['MISSING_NICHE_ID', 'INVALID_CONFIDENCE', 'MISSING_LIMITATIONS'])
  })

  it('reclassificação exige ator', () => {
    const [n] = importPotentialNiches(fixturePersonaIntakePackage.snapshot.potentialNiches, { importedAt: '2026-09-22T00:00:00.000Z', importedBy: 'a' }).imported
    expect(() => reclassifyNiche(n, 'discarded', '', '2026-09-22T00:00:00.000Z')).toThrow()
    const re = reclassifyNiche(n, 'candidate', 'sergio', '2026-09-22T01:00:00.000Z')
    expect(re.classification).toBe('candidate')
  })

  it('sistema propõe, não decide: proposeTopCandidate retorna decidedBy null', () => {
    const niches = importPotentialNiches(fixturePersonaIntakePackage.snapshot.potentialNiches, { importedAt: '2026-09-22T00:00:00.000Z', importedBy: 'a' }).imported
    const proposal = proposeTopCandidate(niches, 'highest_confidence')
    expect(proposal.decidedBy).toBeNull()
    expect(proposal.proposal).not.toBeNull()
  })
})
