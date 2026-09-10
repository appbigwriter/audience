import type { SecretEnvironment, SecretManager, SecretNamespace, SecretReceipt, SecretReference } from './secret-manager'
import { safeManifest } from './secret-manager'

export const DEFAULT_BLOG_SECRET_VARIABLES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

export type BlogProvisioningSecretsInput = {
  projectId: string
  schemaName: string
  environment: SecretEnvironment
  variableNames?: string[]
  templateKey?: string
}

export type BlogProvisioningSecretsReceipt = SecretReceipt & {
  project_id: string
  schema_name: string
  template_key: string
  envExample: string
  developerDoc: string
}

export class BlogProvisioningSecrets {
  constructor(private readonly manager: SecretManager) {}

  async provision(input: BlogProvisioningSecretsInput): Promise<BlogProvisioningSecretsReceipt> {
    if (!input.projectId || !input.schemaName) throw new Error('Secret delivery requires project_id and schema_name from Control Tower readback')
    const namespace = await this.manager.createNamespace(input.projectId, input.schemaName, input.environment, input.variableNames ? [...input.variableNames] : [...DEFAULT_BLOG_SECRET_VARIABLES])
    const secretRefs: SecretReference[] = []
    for (const variableName of namespace.variableNames) secretRefs.push(await this.manager.recordReference(namespace, variableName))
    const validated = await this.manager.validateInjection(namespace, namespace.variableNames)
    const injectionStatus = validated ? 'validated' : (this.manager.constructor.name === 'EasypanelSecretManager' ? 'pending-injection' : 'reference-only')
    const receipt = { provider: secretRefs[0]?.provider || 'reference-only', namespace, secretRefs, manifest: '', injectionStatus } as SecretReceipt
    receipt.manifest = safeManifest(receipt)
    const envExample = namespace.variableNames.map(name => `${name}=<${secretRefs.find(ref => ref.variableName === name)?.secretRef || `secret-manager:${namespace.namespace}${name}`}>`).join('\n')
    const templateKey = input.templateKey || 'custom_base'
    const developerDoc = [
      '# Safe runtime configuration',
      '',
      `project_id: ${input.projectId}`,
      `schema_name: ${input.schemaName}`,
      `template_key: ${templateKey}`,
      `namespace: ${namespace.namespace}`,
      `secret_refs: ${JSON.stringify(secretRefs.map(ref => ref.secretRef))}`,
      '',
      'Values are injected by the authorized runtime provider and are never stored in this document',
      '',
      '```env',
      envExample,
      '```',
    ].join('\n')
    return { ...receipt, project_id: input.projectId, schema_name: input.schemaName, template_key: templateKey, envExample, developerDoc }
  }
}
