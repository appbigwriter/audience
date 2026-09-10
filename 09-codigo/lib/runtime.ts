import { BlogService, MockControlTower, MockHermes } from './index'
import { getRuntimeConfig, assertExternalIntegrationConfigured } from './config'
import { createRepository } from './repository'
import { ConfigurableHermesAdapter } from './hermes-adapter'
import { SupabaseControlTowerAdapter } from './control-tower/real-client'

const globalRuntime = globalThis as typeof globalThis & { __fbrBlogsRuntime?: { repository: ReturnType<typeof createRepository>; service: BlogService } }
export function getBlogRuntime() {
  if (globalRuntime.__fbrBlogsRuntime) return globalRuntime.__fbrBlogsRuntime
  const config = getRuntimeConfig()
  assertExternalIntegrationConfigured(config)
  const repository = createRepository(config)
  const local = config.appEnv === 'local' || config.appEnv === 'development'
  const hermes = local ? new MockHermes(true) : new ConfigurableHermesAdapter({ apiUrl: config.hermesApiUrl, apiKey: config.hermesApiKey, cliCommand: config.hermesCliCommand })
  const tower = local ? new MockControlTower() : new SupabaseControlTowerAdapter({ apiUrl: config.controlTowerApiUrl!, apiKey: config.controlTowerApiKey!, organizationSlug: config.controlTowerOrganizationSlug })
  globalRuntime.__fbrBlogsRuntime = { repository, service: new BlogService(repository, hermes, tower) }
  return globalRuntime.__fbrBlogsRuntime
}
