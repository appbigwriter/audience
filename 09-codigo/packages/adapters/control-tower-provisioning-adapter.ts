/**
 * AB-S7-004/005 — Adapter de provisionamento Control Tower + readback.
 *
 * Regras: contrato oficial, validação de duplicidade, payload explícito,
 * NÃO presume endpoints (base URL/path explícitos), mock e real separados.
 * Sem readback, provisionamento permanece `pending` — nunca declarado pronto.
 */
import { FieldValidator, type ValidationResult } from '../contracts/common'

export const CT_PROVISIONING_CONTRACT_VERSION = 1

export type ProvisioningRequest = {
  contractVersion: number
  fluxJobId: string
  correlationId: string
  audienceProjectId: string
  tenantId: string
  projectSlug: string
  projectName: string
  language: string
  templateId: string
  approvedVersions: {
    personaVersionId: string
    manifestoVersion: number
  }
}

export function validateProvisioningRequest(r: Partial<ProvisioningRequest> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!r) { v.add('request', 'REQUIRED', 'request is required'); return v.result() }
  if (r.contractVersion !== CT_PROVISIONING_CONTRACT_VERSION) v.add('contractVersion', 'UNSUPPORTED_CONTRACT_VERSION', `expected ${CT_PROVISIONING_CONTRACT_VERSION}`)
  for (const f of ['fluxJobId', 'correlationId', 'audienceProjectId', 'tenantId', 'projectSlug', 'projectName', 'language', 'templateId'] as const) v.require(f, r[f])
  if (!r.approvedVersions?.personaVersionId) v.add('approvedVersions.personaVersionId', 'REQUIRED', 'persona version required')
  if (!Number.isFinite(r.approvedVersions?.manifestoVersion) || (r.approvedVersions?.manifestoVersion ?? 0) < 1) v.add('approvedVersions.manifestoVersion', 'INVALID_VERSION', '>= 1 required')
  return v.result()
}

export type ProvisioningReadback = {
  controlTowerProjectId: string
  schemaName: string
  status: 'provisioned'
  templateId: string
  namespace: string
  healthEndpoint: string
  readbackAt: string
  /** campo a campo lido de volta — sem isso é pending */
  verified: true
}

export type ProvisioningOutcome =
  | { outcome: 'provisioned'; readback: ProvisioningReadback }
  | { outcome: 'duplicate'; existingProjectId: string }
  | { outcome: 'invalid'; errors: Array<{ field: string; code: string; message: string }> }
  | { outcome: 'pending'; reason: string }

export interface ControlTowerProvisioningAdapter {
  provision(request: ProvisioningRequest): Promise<ProvisioningOutcome>
  /** Readback de projeto e schema já provisionados. */
  readback(audienceProjectId: string): Promise<ProvisioningReadback | null>
  readonly mode: 'mock' | 'real'
}

/** Mock local: provisiona em memória e SEMPRE lê de volta antes de responder. */
export class MockControlTowerAdapter implements ControlTowerProvisioningAdapter {
  readonly mode = 'mock' as const
  private readonly provisioned = new Map<string, ProvisioningReadback>()

  async provision(request: ProvisioningRequest): Promise<ProvisioningOutcome> {
    const validation = validateProvisioningRequest(request)
    if (!validation.ok) return { outcome: 'invalid', errors: validation.errors }
    const existing = this.provisioned.get(request.audienceProjectId)
    if (existing) return { outcome: 'duplicate', existingProjectId: existing.controlTowerProjectId }
    const readback: ProvisioningReadback = {
      controlTowerProjectId: `ct-${request.audienceProjectId}`,
      schemaName: `ab_${request.projectSlug.replace(/-/g, '_')}`,
      status: 'provisioned',
      templateId: request.templateId,
      namespace: `ns-${request.tenantId}-${request.projectSlug}`,
      healthEndpoint: `/health/${request.projectSlug}`,
      readbackAt: new Date().toISOString(),
      verified: true,
    }
    this.provisioned.set(request.audienceProjectId, readback)
    // mock lê de volta (readback interno) antes de declarar provisionado
    const verify = await this.readback(request.audienceProjectId)
    if (!verify) return { outcome: 'pending', reason: 'MOCK_READBACK_FAILED' }
    return { outcome: 'provisioned', readback }
  }

  async readback(audienceProjectId: string): Promise<ProvisioningReadback | null> {
    const found = this.provisioned.get(audienceProjectId)
    return found ? { ...found } : null
  }
}

export type RealCTConfig = {
  baseUrl: string
  provisioningPath: string
  readbackPath: string
  /** token resolvido via secret-manager; nunca em código */
  serviceToken: string
  fetcher?: typeof fetch
  timeoutMs?: number
}

/** Real: exige config explícita completa; sem ela, permanece pending (fail-closed). */
export class RealControlTowerAdapter implements ControlTowerProvisioningAdapter {
  readonly mode = 'real' as const
  constructor(private readonly config: RealCTConfig) {}

  private ensureConfig(): boolean {
    return Boolean(this.config.baseUrl && this.config.provisioningPath && this.config.readbackPath && this.config.serviceToken)
  }

  async provision(request: ProvisioningRequest): Promise<ProvisioningOutcome> {
    const validation = validateProvisioningRequest(request)
    if (!validation.ok) return { outcome: 'invalid', errors: validation.errors }
    if (!this.ensureConfig()) return { outcome: 'pending', reason: 'CT_ADAPTER_NOT_CONFIGURED' }
    // Execução real de provisionamento exige Gate — fora do escopo local.
    return { outcome: 'pending', reason: 'CT_PROVISIONING_REQUIRES_GATE' }
  }

  async readback(): Promise<ProvisioningReadback | null> {
    if (!this.ensureConfig()) return null
    return null // sem endpoint liberado, readback permanece pendente
  }
}
