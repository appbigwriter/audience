/**
 * AB-S0-006 — Gate de liberação: libera local com fixture marcada,
 * bloqueia produção com fixture e exige aprovação/integração autorizada.
 */
import { describe, expect, it } from 'vitest'
import { evaluateReleaseGate } from '../../packages/contracts/release-gate'
import { cloneFixturePackage, fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'
import type { PersistenceReadbackCapability } from '../../packages/contracts/persistence-contract'

const persistence: PersistenceReadbackCapability = { contractVersion: 1, readbackSupported: true, tenantScopeRequired: true, backend: 'memory' }

describe('AB-S0-006 — release gate', () => {
  it('libera local com fixture explicitamente test-only', () => {
    const d = evaluateReleaseGate({ target: 'local', personaPackage: fixturePersonaIntakePackage, persistence })
    expect(d.released).toBe(true)
  })

  it('bloqueia produção com fixture (no_test_fixture_in_production)', () => {
    const d = evaluateReleaseGate({ target: 'production', personaPackage: fixturePersonaIntakePackage, persistence })
    expect(d.released).toBe(false)
    expect(d.blockers.map((b) => b.check)).toContain('no_test_fixture_in_production')
    expect(d.blockers.map((b) => b.check)).toContain('external_integration_authorized')
  })

  it('bloqueia quando persona não aprovada', () => {
    const pkg = cloneFixturePackage()
    pkg.status = 'stale'
    const d = evaluateReleaseGate({ target: 'local', personaPackage: pkg, persistence })
    expect(d.released).toBe(false)
    expect(d.blockers.map((b) => b.check)).toContain('persona_approved')
  })

  it('bloqueia quando persistência sem readback', () => {
    const d = evaluateReleaseGate({
      target: 'local',
      personaPackage: fixturePersonaIntakePackage,
      persistence: { ...persistence, readbackSupported: false },
    })
    expect(d.released).toBe(false)
    expect(d.blockers.map((b) => b.check)).toContain('persistence_readback_available')
  })

  it('pacote ausente bloqueia qualquer alvo', () => {
    const d = evaluateReleaseGate({ target: 'local', personaPackage: null, persistence })
    expect(d.released).toBe(false)
  })

  it('produção com persona real aprovada e integração autorizada passaria (contrato), mas permanece pendente de Authority real', () => {
    const pkg = cloneFixturePackage()
    pkg.meta.testOnly = false
    // NOTA: sem Authority real, `externalIntegrationAuthorized` não pode ser
    // honestamente true — o teste verifica apenas a lógica do gate.
    const d = evaluateReleaseGate({ target: 'production', personaPackage: pkg, persistence, externalIntegrationAuthorized: true })
    expect(d.released).toBe(true)
  })
})
