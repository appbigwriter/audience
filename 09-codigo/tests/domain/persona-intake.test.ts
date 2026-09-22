/**
 * AB-S0-001 / AB-S0-002 — Elegibilidade e imutabilidade versão+hash.
 * AB-S0-003 — Pacote canônico validado campo a campo.
 * AB-S0-004 — Fixture completa, reproduzível, test-only.
 */
import { describe, expect, it } from 'vitest'
import {
  compareAgainstBinding,
  decidePersonaEligibility,
  PERSONA_STATUSES_ACCEPTED,
  PERSONA_STATUSES_REJECTED,
  validatePersonaIntakePackage,
} from '../../packages/contracts/persona-intake'
import { cloneFixturePackage, FIXTURE_PERSONA_CONTENT_HASH, fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'
import { computeContentHash, canonicalJson, isCanonicalHash } from '../../packages/contracts/common'

describe('AB-S0-001 — elegibilidade da Persona', () => {
  it('aceita persona approved com versão, hash e aprovação completos', () => {
    const d = decidePersonaEligibility(fixturePersonaIntakePackage)
    expect(d.eligible).toBe(true)
    expect(d.reason).toBeNull()
  })

  it.each(PERSONA_STATUSES_REJECTED)('rejeita status rejeitado: %s', (status) => {
    const pkg = cloneFixturePackage()
    pkg.status = status
    const d = decidePersonaEligibility(pkg)
    expect(d.eligible).toBe(false)
    expect(d.reason?.code).toBe('PERSONA_NOT_APPROVED')
    expect(d.reason?.details).toEqual({ status })
  })

  it('rejeita status desconhecido com razão estruturada', () => {
    const pkg = cloneFixturePackage()
    pkg.status = 'banana'
    const d = decidePersonaEligibility(pkg)
    expect(d.eligible).toBe(false)
    expect(d.reason?.code).toBe('UNKNOWN_PERSONA_STATUS')
  })

  it('bloqueia ausência de versão', () => {
    const pkg = cloneFixturePackage()
    ;(pkg as { personaVersion?: number }).personaVersion = undefined
    const d = decidePersonaEligibility(pkg)
    expect(d.reason?.code).toBe('PERSONA_VERSION_REQUIRED')
  })

  it('bloqueia ausência de versionId', () => {
    const pkg = cloneFixturePackage()
    ;(pkg as { personaVersionId?: string }).personaVersionId = undefined
    const d = decidePersonaEligibility(pkg)
    expect(d.reason?.code).toBe('PERSONA_VERSION_ID_REQUIRED')
  })

  it('bloqueia ausência de hash', () => {
    const pkg = cloneFixturePackage()
    ;(pkg as { contentHash?: string }).contentHash = undefined
    const d = decidePersonaEligibility(pkg)
    expect(d.reason?.code).toBe('CONTENT_HASH_REQUIRED')
  })

  it('bloqueia hash em formato inválido', () => {
    const pkg = cloneFixturePackage()
    pkg.contentHash = 'md5:abc'
    const d = decidePersonaEligibility(pkg)
    expect(d.reason?.code).toBe('CONTENT_HASH_INVALID_FORMAT')
  })

  it('bloqueia ausência de evidência de aprovação', () => {
    const pkg = cloneFixturePackage()
    ;(pkg as { approval?: unknown }).approval = undefined
    const d = decidePersonaEligibility(pkg)
    expect(d.reason?.code).toBe('APPROVAL_EVIDENCE_REQUIRED')
  })

  it('bloqueia aprovação que não cobre a versão', () => {
    const pkg = cloneFixturePackage()
    pkg.approval.approvedVersions = ['outra-versao@v9']
    const d = decidePersonaEligibility(pkg)
    expect(d.reason?.code).toBe('APPROVAL_DOES_NOT_COVER_VERSION')
  })

  it('erro nunca expõe secrets (detalhes só com códigos e campos estruturais)', () => {
    const pkg = cloneFixturePackage()
    pkg.status = 'draft'
    const serialized = JSON.stringify(decidePersonaEligibility(pkg))
    expect(serialized).not.toMatch(/secret|token|password|api[-_]?key/i)
  })

  it('tabela de estados: somente approved é aceito', () => {
    expect([...PERSONA_STATUSES_ACCEPTED]).toEqual(['approved'])
    expect(PERSONA_STATUSES_REJECTED).toContain('stale')
  })
})

describe('AB-S0-002 — versão imutável e hash', () => {
  const binding = { personaVersionId: fixturePersonaIntakePackage.personaVersionId, contentHash: fixturePersonaIntakePackage.contentHash }

  it('mesma versão + mesmo hash é idempotente (replay)', () => {
    const out = compareAgainstBinding(fixturePersonaIntakePackage, binding)
    expect(out.outcome).toBe('replay')
  })

  it('hash divergente bloqueia consumo', () => {
    const pkg = cloneFixturePackage()
    pkg.contentHash = computeContentHash({ altered: true })
    const out = compareAgainstBinding(pkg, binding)
    expect(out.outcome).toBe('divergent')
    if (out.outcome === 'divergent') expect(out.code).toBe('SNAPSHOT_HASH_DIVERGENT')
  })

  it('versão diferente exige novo binding (stale)', () => {
    const pkg = cloneFixturePackage()
    pkg.personaVersionId = 'fixture-persona-ab-001@v2'
    pkg.personaVersion = 2
    const out = compareAgainstBinding(pkg, binding)
    expect(out.outcome).toBe('stale_version')
  })

  it('sem binding existente, primeira versão é aceita', () => {
    const out = compareAgainstBinding(fixturePersonaIntakePackage, null)
    expect(out.outcome).toBe('accepted')
  })

  it('hash canônico é estável entre execuções (chaves ordenadas)', () => {
    expect(computeContentHash(fixturePersonaIntakePackage.snapshot)).toBe(FIXTURE_PERSONA_CONTENT_HASH)
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }))
    expect(isCanonicalHash(FIXTURE_PERSONA_CONTENT_HASH)).toBe(true)
  })
})

describe('AB-S0-003 — pacote canônico', () => {
  it('fixture completa passa na validação de todos os campos obrigatórios', () => {
    const r = validatePersonaIntakePackage(fixturePersonaIntakePackage)
    expect(r.errors).toEqual([])
    expect(r.ok).toBe(true)
  })

  it('remove cada seção do snapshot e recebe erro por campo', () => {
    for (const section of ['characterBible', 'physicalIdentityBible', 'visualConsistencyProfile', 'editorialProfile', 'channelPlans', 'disclosurePolicy'] as const) {
      const pkg = cloneFixturePackage()
      delete (pkg.snapshot as Record<string, unknown>)[section]
      const r = validatePersonaIntakePackage(pkg)
      expect(r.ok).toBe(false)
      expect(r.errors.some((e) => e.field === `snapshot.${section}`)).toBe(true)
    }
  })

  it('rejeita channel plan faltando', () => {
    const pkg = cloneFixturePackage()
    ;(pkg.snapshot.channelPlans as { youtube?: unknown }).youtube = undefined
    const r = validatePersonaIntakePackage(pkg)
    expect(r.errors.some((e) => e.field === 'snapshot.channelPlans.youtube')).toBe(true)
  })

  it('rejeita nico com confidence fora do intervalo e sem limitations', () => {
    const pkg = cloneFixturePackage()
    pkg.snapshot.potentialNiches = [{ ...pkg.snapshot.potentialNiches[0], confidence: 1.5, limitations: [] }]
    const r = validatePersonaIntakePackage(pkg)
    expect(r.errors.some((e) => e.code === 'INVALID_RANGE')).toBe(true)
    expect(r.errors.some((e) => e.code === 'REQUIRED_NON_EMPTY')).toBe(true)
  })

  it('meta.testOnly ausente é inválido (marcação explícita obrigatória)', () => {
    const pkg = cloneFixturePackage()
    ;(pkg as { meta?: unknown }).meta = undefined
    const r = validatePersonaIntakePackage(pkg)
    expect(r.errors.some((e) => e.field === 'meta.testOnly')).toBe(true)
  })
})

describe('AB-S0-004 — fixture test-only', () => {
  it('é marcada testOnly e não contém valores secretos', () => {
    expect(fixturePersonaIntakePackage.meta.testOnly).toBe(true)
    const serialized = JSON.stringify(fixturePersonaIntakePackage)
    // nenhuma CHAVE sensível nem valor com cara de credencial
    expect(serialized).not.toMatch(/"(?:secret|secrets|password|api_key|apikey|bearer_token|access_token)"\s*:/i)
    expect(serialized).not.toMatch(/(?:sk-[a-zA-Z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]{8,})/)
  })

  it('hash é reproduzível: recalculado igual ao declarado', () => {
    expect(fixturePersonaIntakePackage.contentHash).toBe(computeContentHash(fixturePersonaIntakePackage.snapshot))
  })

  it('fixture incompleta falha na validação', () => {
    const pkg = cloneFixturePackage()
    delete (pkg.snapshot.characterBible as Record<string, unknown>).centralPromise
    expect(validatePersonaIntakePackage(pkg).ok).toBe(false)
  })
})
