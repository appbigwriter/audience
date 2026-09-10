export type SecretEnvironment = 'development' | 'staging' | 'production'

export type SecretNamespace = {
  projectId: string
  schemaName: string
  environment: SecretEnvironment
  namespace: string
  variableNames: string[]
}

export type SecretReference = {
  variableName: string
  secretRef: string
  provider: string
  namespace: string
  status: 'reference-only' | 'pending-injection' | 'injected'
}

export type SecretReceipt = {
  provider: string
  namespace: SecretNamespace
  secretRefs: SecretReference[]
  manifest: string
  publicManifest?: Record<string, unknown>
  runtimeManifest?: Record<string, unknown>
  injectionStatus: 'reference-only' | 'pending-injection' | 'validated'
}

export type SecretOperatorAuthorization = { role: 'operator'; actor: string }
export type SecretManagerFetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export interface SecretManager {
  createNamespace(projectId: string, schemaName: string, environment: SecretEnvironment, variableNames: string[]): Promise<SecretNamespace> | SecretNamespace
  putSecretRef(namespace: SecretNamespace, variableName: string, secretRef?: string): Promise<SecretReference> | SecretReference
  recordReference(namespace: SecretNamespace, variableName: string, secretRef?: string): Promise<SecretReference> | SecretReference
  getRuntimeReferences(namespace: SecretNamespace): Promise<SecretReference[]> | SecretReference[]
  validateInjection(namespace: SecretNamespace, variableNames?: string[]): Promise<boolean> | boolean
  rotate(namespace: SecretNamespace, variableName: string, authorization?: SecretOperatorAuthorization): Promise<SecretReference> | SecretReference
  revoke(namespace: SecretNamespace, variableName: string, authorization?: SecretOperatorAuthorization): Promise<void> | void
}

export function namespaceFor(projectId: string, prefix = 'fbr/blogs'): string {
  if (!projectId || projectId.includes('/') || projectId.includes('..') || !/^[A-Za-z0-9_-]+$/.test(projectId)) throw new Error('projectId is required and must be namespace-safe')
  const normalizedPrefix = prefix.replace(/\/+$/, '')
  return `${normalizedPrefix}/${projectId}/`
}

function validateVariableName(variableName: string): void {
  if (!/^[A-Z][A-Z0-9_]*$/.test(variableName)) throw new Error(`Invalid secret variable name: ${variableName}`)
}

function ensureReference(namespace: SecretNamespace, variableName: string, secretRef: string): void {
  validateVariableName(variableName)
  if (!namespace.variableNames.includes(variableName)) throw new Error(`Variable is outside namespace contract: ${variableName}`)
  if (!secretRef.startsWith(`secret-manager:${namespace.namespace}`) || secretRef.includes('..')) throw new Error('secretRef must remain inside the project namespace')
}

export class ReferenceOnlySecretManager implements SecretManager {
  private readonly references = new Map<string, SecretReference[]>()
  constructor(private readonly provider = 'reference-only', private readonly prefix = 'fbr/blogs') {}
  createNamespace(projectId: string, schemaName: string, environment: SecretEnvironment, variableNames: string[]): SecretNamespace {
    if (!schemaName) throw new Error('schemaName is required for a secret namespace')
    const uniqueNames = [...new Set(variableNames)]
    uniqueNames.forEach(validateVariableName)
    const namespace = { projectId, schemaName, environment, namespace: namespaceFor(projectId, this.prefix), variableNames: uniqueNames }
    if (!this.references.has(namespace.namespace)) this.references.set(namespace.namespace, [])
    return namespace
  }
  putSecretRef(namespace: SecretNamespace, variableName: string, secretRef = `secret-manager:${namespace.namespace}${variableName}`): SecretReference {
    ensureReference(namespace, variableName, secretRef)
    const reference = { variableName, secretRef, provider: this.provider, namespace: namespace.namespace, status: 'reference-only' as const }
    this.references.set(namespace.namespace, [...(this.references.get(namespace.namespace) || []).filter(item => item.variableName !== variableName), reference])
    return reference
  }
  recordReference(namespace: SecretNamespace, variableName: string, secretRef?: string) { return this.putSecretRef(namespace, variableName, secretRef) }
  getRuntimeReferences(namespace: SecretNamespace) { return [...(this.references.get(namespace.namespace) || [])] }
  validateInjection(namespace: SecretNamespace, variableNames = namespace.variableNames) { const refs = this.getRuntimeReferences(namespace); return variableNames.every(name => refs.some(ref => ref.variableName === name)) }
  rotate(namespace: SecretNamespace, variableName: string, authorization?: SecretOperatorAuthorization) { ensureOperator(authorization); return this.putSecretRef(namespace, variableName, `secret-manager:${namespace.namespace}${variableName}/next`) }
  revoke(namespace: SecretNamespace, variableName: string, authorization?: SecretOperatorAuthorization) { ensureOperator(authorization); this.references.set(namespace.namespace, this.getRuntimeReferences(namespace).filter(item => item.variableName !== variableName)) }
}

function ensureOperator(authorization?: SecretOperatorAuthorization): void {
  if (!authorization || authorization.role !== 'operator' || !authorization.actor) throw new Error('Secret lifecycle operation requires authorized operator context')
}

function joinUrl(base: string, path: string): string {
  const parsed = new URL(base)
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('Control Tower Secret Manager requires an http(s) base URL')
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export class ControlTowerSecretManager implements SecretManager {
  private readonly refs = new Map<string, SecretReference[]>()
  constructor(private readonly options: { baseUrl: string; apiKey: string; callerService: string; environment: SecretEnvironment; fetcher?: SecretManagerFetcher; timeoutMs?: number; namespacePrefix?: string }) {
    if (!options.baseUrl || !options.apiKey || !options.callerService) throw new Error('Control Tower Secret Manager requires base URL, agent API key and caller service')
  }
  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.options.timeoutMs || 10000)
    try {
      const response = await (this.options.fetcher || fetch)(joinUrl(this.options.baseUrl, path), { ...init, signal: controller.signal, headers: { Authorization: `Bearer ${this.options.apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json', 'x-fbr-environment': this.options.environment, 'x-fbr-caller-service': this.options.callerService, ...(init.headers || {}) } })
      if (!response.ok) throw new Error(`Control Tower Secret Manager error (${response.status}) at ${path.split('?')[0]}`)
      return response.status === 204 ? null : response.json()
    } catch (error) { if (error instanceof Error && error.message.startsWith('Control Tower Secret Manager error')) throw error; throw new Error('Control Tower Secret Manager request failed') } finally { clearTimeout(timer) }
  }
  createNamespace(projectId: string, schemaName: string, environment: SecretEnvironment, variableNames: string[]) {
    const names = [...new Set(variableNames)]; names.forEach(validateVariableName); const namespace = { projectId, schemaName, environment, namespace: namespaceFor(projectId, this.options.namespacePrefix || 'fbr/blogs'), variableNames: names }
    return this.request('/secrets/namespaces', { method: 'POST', body: JSON.stringify({ project_id: projectId, schema_name: schemaName, environment, namespace: namespace.namespace, variable_names: names }) }).then(() => { if (!this.refs.has(namespace.namespace)) this.refs.set(namespace.namespace, []); return namespace })
  }
  recordReference(namespace: SecretNamespace, variableName: string, secretRef?: string) {
    const ref = secretRef || `secret-manager:${namespace.namespace}${variableName}`; ensureReference(namespace, variableName, ref)
    return this.putSecretRef(namespace, variableName, ref)
  }
  putSecretRef(namespace: SecretNamespace, variableName: string, secretRef = `secret-manager:${namespace.namespace}${variableName}`) {
    ensureReference(namespace, variableName, secretRef)
    return this.request('/secrets/bindings', { method: 'POST', body: JSON.stringify({ project_id: namespace.projectId, schema_name: namespace.schemaName, namespace: namespace.namespace, secret_refs: [{ variable_name: variableName, secret_ref: secretRef }] }) }).then(() => { const ref = { variableName, secretRef, provider: 'control-tower', namespace: namespace.namespace, status: 'pending-injection' as const }; this.refs.set(namespace.namespace, [...(this.refs.get(namespace.namespace) || []).filter(x => x.variableName !== variableName), ref]); return ref })
  }
  getRuntimeReferences(namespace: SecretNamespace) { return [...(this.refs.get(namespace.namespace) || [])] }
  async getNamespace(projectId: string): Promise<unknown> { return this.request(`/secrets/namespaces/${encodeURIComponent(projectId)}`) }
  async validateInjection(namespace: SecretNamespace, variableNames = namespace.variableNames) { const result = await this.request(`/secrets/validate/${encodeURIComponent(namespace.projectId)}`) as { valid?: boolean; validated?: boolean }; return result.valid === true || result.validated === true }
  async rotate(namespace: SecretNamespace, variableName: string, authorization?: SecretOperatorAuthorization) { ensureOperator(authorization); validateVariableName(variableName); if (!namespace.variableNames.includes(variableName)) throw new Error(`Variable is outside namespace contract: ${variableName}`); return this.referenceFromResponse(namespace, variableName, await this.request('/secrets/rotate', { method: 'POST', body: JSON.stringify({ project_id: namespace.projectId, namespace: namespace.namespace, variable_name: variableName }) })) }
  async revoke(namespace: SecretNamespace, variableName: string, authorization?: SecretOperatorAuthorization) {
    ensureOperator(authorization)
    validateVariableName(variableName)
    await this.request('/secrets/revoke', { method: 'POST', body: JSON.stringify({ project_id: namespace.projectId, namespace: namespace.namespace, variable_name: variableName }) })
    this.refs.set(namespace.namespace, this.getRuntimeReferences(namespace).filter(x => x.variableName !== variableName))
  }
  private referenceFromResponse(namespace: SecretNamespace, variableName: string, result: unknown): SecretReference { const candidate = (result as { secret_ref?: string } | null)?.secret_ref; const ref = candidate || `secret-manager:${namespace.namespace}${variableName}/next`; ensureReference(namespace, variableName, ref); const value = { variableName, secretRef: ref, provider: 'control-tower', namespace: namespace.namespace, status: 'pending-injection' as const }; this.refs.set(namespace.namespace, [...this.getRuntimeReferences(namespace).filter(x => x.variableName !== variableName), value]); return value }
}

export interface EasypanelProviderAdapter { validate(namespace: SecretNamespace, variableNames: string[]): Promise<boolean> }
export class EasypanelSecretManager implements SecretManager {
  private readonly referenceOnly: ReferenceOnlySecretManager
  constructor(private readonly options: { provider?: EasypanelProviderAdapter; namespacePrefix?: string; production?: boolean; apiUrl?: string; apiToken?: string }) { if ((options.production || options.apiUrl || options.apiToken) && !options.provider) throw new Error('Easypanel contract not configured: official API contract is required'); this.referenceOnly = new ReferenceOnlySecretManager('easypanel', options.namespacePrefix || 'fbr/blogs') }
  private local() { return this.referenceOnly }
  createNamespace(...args: Parameters<SecretManager['createNamespace']>) { return this.local().createNamespace(...args) }
  putSecretRef(...args: Parameters<SecretManager['putSecretRef']>) { return this.local().putSecretRef(...args) }
  recordReference(...args: Parameters<SecretManager['recordReference']>) { return this.local().recordReference(...args) }
  getRuntimeReferences(...args: Parameters<SecretManager['getRuntimeReferences']>) { return this.local().getRuntimeReferences(...args) }
  validateInjection(namespace: SecretNamespace, variableNames = namespace.variableNames) { return this.options.provider ? this.options.provider.validate(namespace, variableNames) : false }
  async rotate(...args: Parameters<SecretManager['rotate']>): Promise<SecretReference> { void args; throw new Error('Easypanel contract not configured: official API contract is required') }
  async revoke(...args: Parameters<SecretManager['revoke']>): Promise<void> { void args; throw new Error('Easypanel contract not configured: official API contract is required') }
}

export function safeManifest(receipt: SecretReceipt): string { return JSON.stringify({ project_id: receipt.namespace.projectId, schema_name: receipt.namespace.schemaName, namespace: receipt.namespace.namespace, public_manifest: receipt.publicManifest || {}, runtime_manifest: receipt.runtimeManifest || {}, secret_refs: receipt.secretRefs.map(ref => ({ variable_name: ref.variableName, secret_ref: ref.secretRef, provider: ref.provider, namespace: ref.namespace, status: ref.status })) }, null, 2) }
