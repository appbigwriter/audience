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
  injectionStatus: 'reference-only' | 'pending-injection' | 'validated'
}

export interface SecretManager {
  createNamespace(projectId: string, schemaName: string, environment: SecretEnvironment, variableNames: string[]): Promise<SecretNamespace> | SecretNamespace
  putSecretRef(namespace: SecretNamespace, variableName: string, secretRef?: string): Promise<SecretReference> | SecretReference
  recordReference(namespace: SecretNamespace, variableName: string, secretRef?: string): Promise<SecretReference> | SecretReference
  getRuntimeReferences(namespace: SecretNamespace): Promise<SecretReference[]> | SecretReference[]
  validateInjection(namespace: SecretNamespace, variableNames?: string[]): Promise<boolean> | boolean
  rotate(namespace: SecretNamespace, variableName: string): Promise<SecretReference> | SecretReference
  revoke(namespace: SecretNamespace, variableName: string): Promise<void> | void
}

export function namespaceFor(projectId: string, prefix = 'fbr/blogs'): string {
  if (!projectId || projectId.includes('/') || projectId.includes('..')) throw new Error('projectId is required and must be namespace-safe')
  const normalizedPrefix = prefix.replace(/\/+$/, '')
  return `${normalizedPrefix}/${projectId}/`
}

function validateVariableName(variableName: string): void {
  if (!/^[A-Z][A-Z0-9_]*$/.test(variableName)) throw new Error(`Invalid secret variable name: ${variableName}`)
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
    validateVariableName(variableName)
    if (!namespace.variableNames.includes(variableName)) throw new Error(`Variable is outside namespace contract: ${variableName}`)
    if (!secretRef.startsWith(`secret-manager:${namespace.namespace}`)) throw new Error('secretRef must remain inside the project namespace')
    const reference = { variableName, secretRef, provider: this.provider, namespace: namespace.namespace, status: 'reference-only' as const }
    const current = this.references.get(namespace.namespace) || []
    this.references.set(namespace.namespace, [...current.filter(item => item.variableName !== variableName), reference])
    return reference
  }

  recordReference(namespace: SecretNamespace, variableName: string, secretRef?: string) { return this.putSecretRef(namespace, variableName, secretRef) }
  getRuntimeReferences(namespace: SecretNamespace) { return [...(this.references.get(namespace.namespace) || [])] }
  validateInjection(namespace: SecretNamespace, variableNames = namespace.variableNames) {
    const refs = this.getRuntimeReferences(namespace)
    return variableNames.every(name => refs.some(ref => ref.variableName === name))
  }
  rotate(namespace: SecretNamespace, variableName: string) { return this.putSecretRef(namespace, variableName, `secret-manager:${namespace.namespace}${variableName}/next`) }
  revoke(namespace: SecretNamespace, variableName: string) { this.references.set(namespace.namespace, this.getRuntimeReferences(namespace).filter(item => item.variableName !== variableName)) }
}

export class EasypanelSecretManager implements SecretManager {
  private readonly referenceOnly: ReferenceOnlySecretManager
  constructor(private readonly options: { apiUrl?: string; apiToken?: string; namespacePrefix?: string; documentedContract?: { name: string; version: string } }) {
    if (!options.apiUrl || !options.apiToken) throw new Error('Easypanel Secret Manager requires EASYPANEL_API_URL and EASYPANEL_API_TOKEN')
    if (!options.documentedContract) throw new Error('Easypanel Secret Manager is fail-closed until an official API contract is supplied')
    this.referenceOnly = new ReferenceOnlySecretManager('easypanel', options.namespacePrefix || 'fbr/blogs')
  }
  createNamespace(...args: Parameters<SecretManager['createNamespace']>) { return this.referenceOnly.createNamespace(...args) }
  putSecretRef(...args: Parameters<SecretManager['putSecretRef']>) { return this.referenceOnly.putSecretRef(...args) }
  recordReference(...args: Parameters<SecretManager['recordReference']>) { return this.referenceOnly.recordReference(...args) }
  getRuntimeReferences(...args: Parameters<SecretManager['getRuntimeReferences']>) { return this.referenceOnly.getRuntimeReferences(...args) }
  validateInjection() { return false }
  rotate(...args: Parameters<SecretManager['rotate']>) { return this.referenceOnly.rotate(...args) }
  revoke(...args: Parameters<SecretManager['revoke']>) { return this.referenceOnly.revoke(...args) }
}

export function safeManifest(receipt: SecretReceipt): string {
  return JSON.stringify({ provider: receipt.provider, namespace: receipt.namespace.namespace, project_id: receipt.namespace.projectId, schema_name: receipt.namespace.schemaName, template_key: 'custom_base', secret_refs: receipt.secretRefs.map(ref => ({ variable_name: ref.variableName, secret_ref: ref.secretRef, provider: ref.provider, namespace: ref.namespace, status: ref.status })), injection_status: receipt.injectionStatus }, null, 2)
}
