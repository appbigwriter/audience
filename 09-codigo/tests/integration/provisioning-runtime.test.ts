/**
 * AB-S7-004/005/006/007 — adapters e runtime: provisionamento com readback,
 * env por referência, health ≠ deploy.
 */
import { describe, expect, it } from 'vitest'
import { MockControlTowerAdapter, RealControlTowerAdapter, validateProvisioningRequest, type ProvisioningRequest } from '../../packages/adapters/control-tower-provisioning-adapter'
import { buildHealthReport, sanitizeEnvForClient, validateDeployRecord, validateRuntimeEnvFile, type DeployRecord, type RuntimeEnvFile } from '../../packages/contracts/runtime-contract'

const validRequest: ProvisioningRequest = {
  contractVersion: 1,
  fluxJobId: 'job-1',
  correlationId: 'corr-1',
  audienceProjectId: 'ap-1',
  tenantId: 'tenant-1',
  projectSlug: 'projeto-fixture',
  projectName: 'Projeto Fixture',
  language: 'pt-BR',
  templateId: 'tpl-editorial-reference',
  approvedVersions: { personaVersionId: 'fixture-persona-ab-001@v1', manifestoVersion: 1 },
}

describe('AB-S7-004 — adapter de provisionamento', () => {
  it('valida payload explícito', () => expect(validateProvisioningRequest(validRequest).ok).toBe(true))
  it('payload incompleto é inválido por campo', () => {
    const r = validateProvisioningRequest({ ...validRequest, fluxJobId: '', approvedVersions: { personaVersionId: '', manifestoVersion: 0 } })
    expect(r.errors.some((e) => e.field === 'fluxJobId')).toBe(true)
    expect(r.errors.some((e) => e.field === 'approvedVersions.manifestoVersion')).toBe(true)
  })

  it('mock provisiona com readback verificado', async () => {
    const ct = new MockControlTowerAdapter()
    const out = await ct.provision(validRequest)
    expect(out.outcome).toBe('provisioned')
    if (out.outcome === 'provisioned') {
      expect(out.readback.verified).toBe(true)
      expect(out.readback.schemaName).toBe('ab_projeto_fixture')
    }
    const rb = await ct.readback('ap-1')
    expect(rb?.controlTowerProjectId).toBe('ct-ap-1')
  })

  it('duplicidade detectada no mock', async () => {
    const ct = new MockControlTowerAdapter()
    await ct.provision(validRequest)
    const second = await ct.provision(validRequest)
    expect(second.outcome).toBe('duplicate')
  })

  it('real sem configuração permanece pending (fail-closed, sem gate)', async () => {
    const ct = new RealControlTowerAdapter({ baseUrl: '', provisioningPath: '', readbackPath: '', serviceToken: '' })
    const out = await ct.provision(validRequest)
    expect(out.outcome).toBe('pending')
    if (out.outcome === 'pending') expect(out.reason).toBe('CT_ADAPTER_NOT_CONFIGURED')
    expect(await ct.readback()).toBeNull()
  })
})

describe('AB-S7-006 — runtime env contract', () => {
  const validEnv: RuntimeEnvFile = {
    projectId: 'ap-1',
    specVersion: 1,
    variables: [
      { variable: 'CT_SERVICE_TOKEN', kind: 'secret', reference: 'secret-ref://control-tower/service-token', description: 'token CT', required: true },
      { variable: 'SITE_URL', kind: 'derived', description: 'url derivada do domínio', required: true },
      { variable: 'FEATURE_NEWSLETTER', kind: 'optional', description: 'flag opcional', required: false },
    ],
    generatedAt: '2026-09-22T00:00:00.000Z',
  }

  it('env file válido passa', () => expect(validateRuntimeEnvFile(validEnv).ok).toBe(true))
  it('secret sem referência secret-ref:// rejeita', () => {
    const r = validateRuntimeEnvFile({ ...validEnv, variables: [{ variable: 'X', kind: 'secret', reference: 'valor-plaintext', description: 'x', required: true }] })
    expect(r.errors.some((e) => e.code === 'SECRET_REF_REQUIRED')).toBe(true)
  })
  it('optional+required é contradição', () => {
    const r = validateRuntimeEnvFile({ ...validEnv, variables: [{ variable: 'X', kind: 'optional', description: 'x', required: true }] })
    expect(r.errors.some((e) => e.code === 'CONTRADICTION')).toBe(true)
  })
  it('variável duplicada rejeita', () => {
    const r = validateRuntimeEnvFile({ ...validEnv, variables: [...validEnv.variables, validEnv.variables[1]] })
    expect(r.errors.some((e) => e.code === 'DUPLICATE')).toBe(true)
  })
  it('frontend nunca recebe plaintext de secret', () => {
    const sanitized = sanitizeEnvForClient(validEnv, { CT_SERVICE_TOKEN: 'super-secreto', SITE_URL: 'https://x', FEATURE_NEWSLETTER: 'off' })
    expect(sanitized.CT_SERVICE_TOKEN).toBe('***redacted***')
    expect(sanitized.SITE_URL).toBe('https://x')
    expect(JSON.stringify(sanitized)).not.toContain('super-secreto')
  })
})

describe('AB-S7-007 — health/deploy/rollback', () => {
  const deploy: DeployRecord = {
    projectId: 'ap-1',
    version: '1.0.0',
    contentHash: `sha256:${'a'.repeat(64)}`,
    target: 'local',
    deployedAt: '2026-09-22T00:00:00.000Z',
    deployedBy: 'agent-a',
    previousVersion: '0.9.0',
    rollbackTo: null,
  }

  it('deploy record válido passa', () => expect(validateDeployRecord(deploy).ok).toBe(true))
  it('hash inválido rejeita', () => expect(validateDeployRecord({ ...deploy, contentHash: 'xyz' }).ok).toBe(false))
  it('health ≠ deploy: sem deploy, versão é null mesmo saudável', () => {
    const h = buildHealthReport('ap-1', { reachable: true, latencyOk: true }, null, '2026-09-22T00:00:00.000Z')
    expect(h.status).toBe('healthy')
    expect(h.deploy.deployedVersion).toBeNull()
  })
  it('com deploy, registra versão/hash e rollback disponível', () => {
    const h = buildHealthReport('ap-1', { reachable: true, latencyOk: true }, deploy, '2026-09-22T00:00:00.000Z')
    expect(h.deploy.deployedVersion).toBe('1.0.0')
    expect(h.rollbackAvailable).toBe(true)
    expect(h.lastReadbackRef).toContain('deploy-readback')
  })
  it('inalcançável = down', () => {
    const h = buildHealthReport('ap-1', { reachable: false, latencyOk: false }, deploy, '2026-09-22T00:00:00.000Z')
    expect(h.status).toBe('down')
  })
})
