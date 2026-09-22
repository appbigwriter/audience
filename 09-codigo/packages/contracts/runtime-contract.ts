/**
 * AB-S7-006 — Runtime contract: env por referência, classificação
 * secret/derivada/opcional, plaintext jamais retorna ao frontend.
 *
 * AB-S7-007 — Health/deploy/rollback contract: health ≠ deploy; versão/hash,
 * target, rollback e readback registrados.
 */
import { FieldValidator, type ValidationResult } from '../contracts/common'

// ---------------------------------------------------------------------------
// AB-S7-006 — runtime env contract
// ---------------------------------------------------------------------------

export type EnvVarKind = 'secret' | 'derived' | 'optional'

export type RuntimeEnvSpec = {
  variable: string
  kind: EnvVarKind
  /** para secret: referência ao secret-manager (nunca o valor) */
  reference?: string
  description: string
  required: boolean
}

export type RuntimeEnvFile = {
  projectId: string
  specVersion: number
  variables: RuntimeEnvSpec[]
  generatedAt: string
}

export function validateRuntimeEnvFile(f: Partial<RuntimeEnvFile> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!f) { v.add('envFile', 'REQUIRED', 'env file is required'); return v.result() }
  v.require('projectId', f.projectId)
  if (f.specVersion !== 1) v.add('specVersion', 'UNSUPPORTED_VERSION', 'expected 1')
  if (!Array.isArray(f.variables) || f.variables.length === 0) v.add('variables', 'REQUIRED_NON_EMPTY', 'at least one variable')
  else {
    const seen = new Set<string>()
    f.variables.forEach((spec, i) => {
      const base = `variables[${i}]`
      if (!spec?.variable) v.add(`${base}.variable`, 'REQUIRED', 'variable name required')
      else {
        if (seen.has(spec.variable)) v.add(`${base}.variable`, 'DUPLICATE', 'duplicated variable')
        seen.add(spec.variable)
      }
      v.enum(`${base}.kind`, spec?.kind, ['secret', 'derived', 'optional'] as const)
      if (spec?.kind === 'secret') {
        if (!spec.reference || !/^secret-ref:\/\//.test(spec.reference)) v.add(`${base}.reference`, 'SECRET_REF_REQUIRED', "secrets must use 'secret-ref://...' reference")
      }
      if (spec?.kind === 'optional' && spec.required === true) v.add(`${base}.required`, 'CONTRADICTION', 'optional cannot be required')
    })
  }
  return v.result()
}

/**
 * Sanitização para frontend: substitui valor de secret por `***redacted***`.
 * Recebe o mapa de valores JÁ resolvidos (do secret-manager, server-side).
 */
export function sanitizeEnvForClient(envFile: RuntimeEnvFile, resolvedValues: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const spec of envFile.variables) {
    const value = resolvedValues[spec.variable]
    if (spec.kind === 'secret') {
      out[spec.variable] = value ? '***redacted***' : ''
    } else {
      out[spec.variable] = value ?? ''
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// AB-S7-007 — health/deploy/rollback contract
// ---------------------------------------------------------------------------

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export type HealthReport = {
  projectId: string
  status: HealthStatus
  checkedAt: string
  /** health NÃO é deploy */
  deploy: {
    deployedVersion: string | null
    deployedHash: string | null
    target: 'local' | 'staging' | 'production'
    deployedAt: string | null
  }
  rollbackAvailable: boolean
  lastReadbackRef: string | null
}

export type DeployRecord = {
  projectId: string
  version: string
  contentHash: string
  target: 'local' | 'staging' | 'production'
  deployedAt: string
  deployedBy: string
  previousVersion: string | null
  rollbackTo: string | null
}

export function validateDeployRecord(r: Partial<DeployRecord> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!r) { v.add('deploy', 'REQUIRED', 'deploy record required'); return v.result() }
  v.require('projectId', r.projectId)
  v.require('version', r.version)
  if (!r.contentHash || !/^sha256:[0-9a-f]{64}$/.test(r.contentHash)) v.add('contentHash', 'INVALID_FORMAT', 'expected sha256:<64hex>')
  v.enum('target', r.target, ['local', 'staging', 'production'] as const)
  if (!r.deployedAt || Number.isNaN(new Date(r.deployedAt).getTime())) v.add('deployedAt', 'INVALID_DATE', 'ISO required')
  v.require('deployedBy', r.deployedBy)
  return v.result()
}

/** Health decompõe estado de deploy: serviço saudável sem deploy é 'unknown' para versão. */
export function buildHealthReport(projectId: string, probe: { reachable: boolean; latencyOk: boolean }, deploy: DeployRecord | null, now: string): HealthReport {
  const status: HealthStatus = !probe.reachable ? 'down' : probe.latencyOk ? 'healthy' : 'degraded'
  return {
    projectId,
    status,
    checkedAt: now,
    deploy: deploy
      ? { deployedVersion: deploy.version, deployedHash: deploy.contentHash, target: deploy.target, deployedAt: deploy.deployedAt }
      : { deployedVersion: null, deployedHash: null, target: 'local', deployedAt: null },
    rollbackAvailable: deploy?.previousVersion != null,
    lastReadbackRef: deploy ? `deploy-readback:${deploy.projectId}@${deploy.version}` : null,
  }
}
