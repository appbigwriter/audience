export type RuntimeMode = 'local' | 'development' | 'production'
export type SecretsProvider = 'reference' | 'control-tower' | 'easypanel'

export type RuntimeConfig = {
  appEnv: RuntimeMode; localDataPath: string; blogSchema: string; controlTowerProjectId?: string; controlTowerSchemaName?: string; supabaseUrl?: string; supabaseServiceRoleKey?: string
  controlTowerApiUrl?: string; controlTowerApiKey?: string; controlTowerOrganizationSlug: string; controlTowerHandoffBaseUrl?: string; controlTowerHandoffPathTemplate?: string
  hermesApiUrl?: string; hermesApiKey?: string; hermesCreatePath?: string; hermesHealthPathTemplate?: string; hermesCliCommand?: string; fbrAdsApiUrl?: string; fbrAdsApiKey?: string; fbrAdsInventoryPath?: string; fbrAdsCreativePath?: string
  secretsProvider?: SecretsProvider; secretsNamespacePrefix?: string; controlTowerSecretsBaseUrl?: string; controlTowerAgentApiKey?: string; fbrCallerService?: string; fbrEnvironment?: string; easypanelApiUrl?: string; easypanelApiToken?: string
}

export function getRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const appEnv = (env.APP_ENV || 'production') as RuntimeMode
  if (!['local', 'development', 'production'].includes(appEnv)) throw new Error('APP_ENV must be local, development, or production')
  if (appEnv === 'production' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) throw new Error('Production requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; local fallback is disabled')
  const secretsProvider = (env.SECRETS_PROVIDER || (appEnv === 'local' ? 'reference' : '')) as SecretsProvider
  if (!['reference', 'control-tower', 'easypanel'].includes(secretsProvider)) throw new Error('Production requires SECRETS_PROVIDER=reference, control-tower, or easypanel')
  return { appEnv, localDataPath: env.BLOG_LOCAL_DATA_PATH || '.data/fbr-blogs.json', controlTowerProjectId: env.CONTROL_TOWER_PROJECT_ID, controlTowerSchemaName: env.CONTROL_TOWER_SCHEMA_NAME, blogSchema: env.CONTROL_TOWER_SCHEMA_NAME || env.BLOG_SCHEMA || 'public', supabaseUrl: env.SUPABASE_URL, supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY, controlTowerApiUrl: env.CONTROL_TOWER_API_URL, controlTowerApiKey: env.CONTROL_TOWER_API_KEY, controlTowerOrganizationSlug: env.CONTROL_TOWER_ORGANIZATION_SLUG || 'gestaodb', controlTowerHandoffBaseUrl: env.CONTROL_TOWER_HANDOFF_BASE_URL, controlTowerHandoffPathTemplate: env.CONTROL_TOWER_HANDOFF_PATH_TEMPLATE, hermesApiUrl: env.HERMES_API_URL, hermesApiKey: env.HERMES_API_KEY, hermesCreatePath: env.HERMES_CREATE_PATH, hermesHealthPathTemplate: env.HERMES_HEALTH_PATH_TEMPLATE, hermesCliCommand: env.HERMES_CLI_COMMAND, fbrAdsApiUrl: env.FBR_ADS_API_URL, fbrAdsApiKey: env.FBR_ADS_API_KEY, fbrAdsInventoryPath: env.FBR_ADS_INVENTORY_PATH, fbrAdsCreativePath: env.FBR_ADS_CREATIVE_PATH, secretsProvider, secretsNamespacePrefix: env.SECRETS_NAMESPACE_PREFIX || 'fbr/blogs', controlTowerSecretsBaseUrl: env.CONTROL_TOWER_SECRETS_BASE_URL, controlTowerAgentApiKey: env.CONTROL_TOWER_AGENT_API_KEY, fbrCallerService: env.FBR_CALLER_SERVICE, fbrEnvironment: env.FBR_ENVIRONMENT || appEnv, easypanelApiUrl: env.EASYPANEL_API_URL, easypanelApiToken: env.EASYPANEL_API_TOKEN }
}

export function assertExternalIntegrationConfigured(config: RuntimeConfig): void {
  if (config.appEnv !== 'production') return
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) throw new Error('Production requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  if (!config.controlTowerProjectId || !config.controlTowerSchemaName) throw new Error('Production requires CONTROL_TOWER_PROJECT_ID and CONTROL_TOWER_SCHEMA_NAME')
  if (config.secretsProvider === 'control-tower' && (!config.controlTowerSecretsBaseUrl || !config.controlTowerAgentApiKey || !config.fbrCallerService || !config.fbrEnvironment)) throw new Error('Production Control Tower secrets require CONTROL_TOWER_SECRETS_BASE_URL, CONTROL_TOWER_AGENT_API_KEY, FBR_CALLER_SERVICE and FBR_ENVIRONMENT')
  if (!config.secretsProvider) throw new Error('Production requires a configured secrets provider')
  if (config.secretsProvider === 'easypanel') throw new Error('Easypanel contract not configured')
  if (!config.controlTowerApiUrl || !config.controlTowerApiKey) throw new Error('Production requires CONTROL_TOWER_API_URL and CONTROL_TOWER_API_KEY')
  const hermesHttp = config.hermesApiUrl && config.hermesApiKey && config.hermesCreatePath && config.hermesHealthPathTemplate
  if (!hermesHttp && !config.hermesCliCommand) throw new Error('Production requires Hermes HTTP contract (URL, key and paths) or HERMES_CLI_COMMAND')
}
