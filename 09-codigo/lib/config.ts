export type RuntimeMode = 'local' | 'development' | 'production'

export type RuntimeConfig = {
  appEnv: RuntimeMode
  localDataPath: string
  blogSchema: string
  supabaseUrl?: string
  supabaseServiceRoleKey?: string
  controlTowerApiUrl?: string
  controlTowerApiKey?: string
  controlTowerOrganizationSlug: string
  controlTowerHandoffBaseUrl?: string
  controlTowerHandoffPathTemplate?: string
  hermesApiUrl?: string
  hermesApiKey?: string
  hermesCreatePath?: string
  hermesHealthPathTemplate?: string
  hermesCliCommand?: string
  fbrAdsApiUrl?: string
  fbrAdsApiKey?: string
  fbrAdsInventoryPath?: string
  fbrAdsCreativePath?: string
}

export function getRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const appEnv = (env.APP_ENV || 'production') as RuntimeMode
  if (!['local', 'development', 'production'].includes(appEnv)) throw new Error('APP_ENV must be local, development, or production')
  if (appEnv === 'production' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('Production requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; local fallback is disabled')
  }
  return {
    appEnv,
    localDataPath: env.BLOG_LOCAL_DATA_PATH || '.data/fbr-blogs.json',
    blogSchema: env.BLOG_SCHEMA || 'public',
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    controlTowerApiUrl: env.CONTROL_TOWER_API_URL,
    controlTowerApiKey: env.CONTROL_TOWER_API_KEY,
    controlTowerOrganizationSlug: env.CONTROL_TOWER_ORGANIZATION_SLUG || 'gestaodb',
    controlTowerHandoffBaseUrl: env.CONTROL_TOWER_HANDOFF_BASE_URL,
    controlTowerHandoffPathTemplate: env.CONTROL_TOWER_HANDOFF_PATH_TEMPLATE,
    hermesApiUrl: env.HERMES_API_URL,
    hermesApiKey: env.HERMES_API_KEY,
    hermesCreatePath: env.HERMES_CREATE_PATH,
    hermesHealthPathTemplate: env.HERMES_HEALTH_PATH_TEMPLATE,
    hermesCliCommand: env.HERMES_CLI_COMMAND,
    fbrAdsApiUrl: env.FBR_ADS_API_URL,
    fbrAdsApiKey: env.FBR_ADS_API_KEY,
    fbrAdsInventoryPath: env.FBR_ADS_INVENTORY_PATH,
    fbrAdsCreativePath: env.FBR_ADS_CREATIVE_PATH,
  }
}

export function assertExternalIntegrationConfigured(config: RuntimeConfig): void {
  if (config.appEnv !== 'production') return
  if (!config.controlTowerApiUrl || !config.controlTowerApiKey) throw new Error('Production requires CONTROL_TOWER_API_URL and CONTROL_TOWER_API_KEY')
  const hermesHttp = config.hermesApiUrl && config.hermesApiKey && config.hermesCreatePath && config.hermesHealthPathTemplate
  if (!hermesHttp && !config.hermesCliCommand) throw new Error('Production requires Hermes HTTP contract (URL, key and paths) or HERMES_CLI_COMMAND')
}
