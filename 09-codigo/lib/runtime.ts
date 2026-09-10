import { BlogService, MockControlTower, MockHermes } from './index'
import { getRuntimeConfig, assertExternalIntegrationConfigured } from './config'
import { createRepository } from './repository'
import { ConfigurableHermesAdapter } from './hermes-adapter'
import { SupabaseControlTowerAdapter } from './control-tower/real-client'
import { EasypanelSecretManager, ReferenceOnlySecretManager } from './secrets/secret-manager'

const globalRuntime = globalThis as typeof globalThis & { __fbrBlogsRuntime?: { repository: ReturnType<typeof createRepository>; service: BlogService } }
export function getBlogRuntime() {
  if (globalRuntime.__fbrBlogsRuntime) return globalRuntime.__fbrBlogsRuntime
  const config = getRuntimeConfig(); assertExternalIntegrationConfigured(config)
  const repository = createRepository(config)
  const local = config.appEnv === 'local'
  const hermes = local ? new MockHermes(true) : new ConfigurableHermesAdapter({ apiUrl: config.hermesApiUrl, apiKey: config.hermesApiKey, createPath: config.hermesCreatePath, healthPathTemplate: config.hermesHealthPathTemplate, cliCommand: config.hermesCliCommand })
  const tower = local ? new MockControlTower() : new SupabaseControlTowerAdapter({ apiUrl: config.controlTowerApiUrl!, apiKey: config.controlTowerApiKey!, organizationSlug: config.controlTowerOrganizationSlug, handoffBaseUrl: config.controlTowerHandoffBaseUrl, handoffPathTemplate: config.controlTowerHandoffPathTemplate })
  const secrets = config.secretsProvider === 'easypanel'
    ? new EasypanelSecretManager({ apiUrl: config.easypanelApiUrl, apiToken: config.easypanelApiToken, namespacePrefix: config.secretsNamespacePrefix || 'fbr/blogs' })
    : new ReferenceOnlySecretManager('reference-only', config.secretsNamespacePrefix || 'fbr/blogs')
  globalRuntime.__fbrBlogsRuntime = { repository, service: new BlogService(repository, hermes, tower, secrets, config.appEnv === 'production' ? 'production' : 'development') }
  return globalRuntime.__fbrBlogsRuntime
}
