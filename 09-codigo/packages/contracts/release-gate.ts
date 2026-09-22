/**
 * AB-S0-006 — Gate de liberação do Audience Builder.
 *
 * Checklist executável que libera ou bloqueia a criação de Audience Projects:
 * - exige Persona aprovada (AB-S0-001);
 * - exige pacote versionado + hash (AB-S0-002);
 * - exige contrato de persistência com readback;
 * - permite desenvolvimento local com fixture explicitamente `testOnly`;
 * - NUNCA permite produção com fixture.
 */
import { decidePersonaEligibility, validatePersonaIntakePackage, type PersonaIntakePackage } from './persona-intake'
import type { PersistenceReadbackCapability } from './persistence-contract'

export type ReleaseGateCheck = {
  check: string
  passed: boolean
  /** `production` exige false estritamente; `local` tolera fixture marcada. */
  severity: 'blocking'
  details: Record<string, unknown>
}

export type ReleaseGateTarget = 'local' | 'production'

export type ReleaseGateDecision = {
  target: ReleaseGateTarget
  released: boolean
  checks: ReleaseGateCheck[]
  /** Presente quando bloqueado. */
  blockers: Array<{ check: string; details: Record<string, unknown> }>
}

export type ReleaseGateInputs = {
  target: ReleaseGateTarget
  personaPackage?: Partial<PersonaIntakePackage> | null
  /** Capacidade de persistência declarada pelo runtime. */
  persistence: PersistenceReadbackCapability
  /** Interação externa autorizada por Gate específico. */
  externalIntegrationAuthorized?: boolean
}

export function evaluateReleaseGate(inputs: ReleaseGateInputs): ReleaseGateDecision {
  const checks: ReleaseGateCheck[] = []
  const pkg = inputs.personaPackage ?? null
  const eligible = decidePersonaEligibility(pkg)
  checks.push({
    check: 'persona_approved',
    passed: eligible.eligible,
    severity: 'blocking',
    details: eligible.reason ? { code: eligible.reason.code, ...eligible.reason.details } : { personaVersionId: pkg?.personaVersionId },
  })
  const validation = validatePersonaIntakePackage(pkg)
  checks.push({
    check: 'package_valid_versioned',
    passed: validation.ok,
    severity: 'blocking',
    details: validation.ok ? { contractVersion: pkg?.contractVersion } : { errors: validation.errors },
  })
  checks.push({
    check: 'persistence_readback_available',
    passed: inputs.persistence.readbackSupported && inputs.persistence.contractVersion >= 1,
    severity: 'blocking',
    details: { ...inputs.persistence },
  })
  const testOnly = pkg?.meta?.testOnly === true
  if (inputs.target === 'production') {
    checks.push({
      check: 'no_test_fixture_in_production',
      passed: !testOnly,
      severity: 'blocking',
      details: testOnly ? { 'meta.testOnly': true } : {},
    })
    checks.push({
      check: 'external_integration_authorized',
      passed: inputs.externalIntegrationAuthorized === true,
      severity: 'blocking',
      details: { authorized: inputs.externalIntegrationAuthorized === true },
    })
  } else {
    // local: fixture marcada é permitida; ausência de marca é razão de bloqueio
    checks.push({
      check: 'fixture_explicitly_marked',
      passed: pkg === null || pkg === undefined || typeof pkg.meta?.testOnly === 'boolean',
      severity: 'blocking',
      details: { testOnly: pkg?.meta?.testOnly },
    })
  }
  const blockers = checks.filter((c) => !c.passed).map((c) => ({ check: c.check, details: c.details }))
  return { target: inputs.target, released: blockers.length === 0, checks, blockers }
}
