/**
 * Adapter Authority — contrato de consulta de Persona aprovada (mock/real separados).
 *
 * Suporte a S0/S2: o domínio consome `PersonaIntakePackage` via interface,
 * permitindo desenvolvimento local com mock enquanto a API oficial do
 * Authority não existe (bloqueios B1–B4 do readiness AB-S0-005).
 *
 * REGRA: `RealAuthorityPersonaAdapter` NÃO presume endpoint — exige base URL
 * e path explícitos configurados; sem eles, falha fechado (fail-closed).
 * Integração real permanece `pendente` até readback oficial.
 */
import type { PersonaIntakePackage } from '../contracts/persona-intake'
import { validatePersonaIntakePackage } from '../contracts/persona-intake'

export type AuthorityFetchOutcome =
  | { outcome: 'fetched'; pkg: PersonaIntakePackage; validated: true }
  | { outcome: 'invalid'; errors: Array<{ field: string; code: string; message: string }> }
  | { outcome: 'not_found' }
  | { outcome: 'integration_pending'; reason: string }

export interface AuthorityPersonaAdapter {
  /** Consulta o pacote aprovado por personaId+versionId. */
  fetchApprovedPackage(personaId: string, personaVersionId: string): Promise<AuthorityFetchOutcome>
  /** Declara se a integração é real ou mock local. */
  readonly mode: 'mock' | 'real'
}

/**
 * Mock local determinístico — serve apenas fixtures testOnly.
 * Nunca simula autenticação nem endpoints reais.
 */
export class MockAuthorityPersonaAdapter implements AuthorityPersonaAdapter {
  readonly mode = 'mock' as const
  constructor(private readonly packages: Map<string, PersonaIntakePackage> = new Map()) {}

  static fromFixtures(...pkgs: PersonaIntakePackage[]): MockAuthorityPersonaAdapter {
    return new MockAuthorityPersonaAdapter(new Map(pkgs.map((p) => [`${p.personaId}@${p.personaVersionId}`, p])))
  }

  async fetchApprovedPackage(personaId: string, personaVersionId: string): Promise<AuthorityFetchOutcome> {
    const pkg = this.packages.get(`${personaId}@${personaVersionId}`)
    if (!pkg) return { outcome: 'not_found' }
    const validation = validatePersonaIntakePackage(pkg)
    if (!validation.ok) return { outcome: 'invalid', errors: validation.errors }
    return { outcome: 'fetched', pkg, validated: true }
  }
}

export type RealAdapterConfig = {
  baseUrl: string
  /** Path explícito do recurso aprovado; não há default presumido. */
  approvedPackagePath: string
  /** Autenticação por referência — o adapter recebe token JÁ RESOLVIDO pelo secret-manager; nunca em código. */
  bearerToken: string
  fetcher?: typeof fetch
  timeoutMs?: number
}

/**
 * Adapter real — SÓ funciona com configuração completa e explícita.
 * Sem endpoint/token: retorna `integration_pending` (não inventa resposta).
 */
export class RealAuthorityPersonaAdapter implements AuthorityPersonaAdapter {
  readonly mode = 'real' as const
  constructor(private readonly config: RealAdapterConfig) {}

  async fetchApprovedPackage(personaId: string, personaVersionId: string): Promise<AuthorityFetchOutcome> {
    if (!this.config.baseUrl || !this.config.approvedPackagePath || !this.config.bearerToken) {
      return { outcome: 'integration_pending', reason: 'AUTHORITY_ADAPTER_NOT_CONFIGURED' }
    }
    const fetcher = this.config.fetcher ?? fetch
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 5000)
    try {
      const url = `${this.config.baseUrl.replace(/\/$/, '')}/${this.config.approvedPackagePath.replace(/^\//, '')}?persona_id=${encodeURIComponent(personaId)}&persona_version_id=${encodeURIComponent(personaVersionId)}`
      const response = await fetcher(url, { headers: { Authorization: `Bearer ${this.config.bearerToken}`, Accept: 'application/json' }, signal: controller.signal })
      if (response.status === 404) return { outcome: 'not_found' }
      if (!response.ok) return { outcome: 'integration_pending', reason: `AUTHORITY_HTTP_${response.status}` }
      const body = (await response.json()) as Partial<PersonaIntakePackage>
      const validation = validatePersonaIntakePackage(body)
      if (!validation.ok) return { outcome: 'invalid', errors: validation.errors }
      return { outcome: 'fetched', pkg: body as PersonaIntakePackage, validated: true }
    } catch (err) {
      const reason = err instanceof Error && err.name === 'AbortError' ? 'AUTHORITY_TIMEOUT' : 'AUTHORITY_UNREACHABLE'
      return { outcome: 'integration_pending', reason }
    } finally {
      clearTimeout(timer)
    }
  }
}
