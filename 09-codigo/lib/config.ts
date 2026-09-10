export type RuntimeMode = 'local' | 'development' | 'production'

export type RuntimeConfig = {
  appEnv: RuntimeMode
  localDataPath: string
  supabaseUrl?: string
  supabaseServiceRoleKey?: string
  controlTowerApiUrl?: string
  controlTowerApiKey?: string
  controlTowerOrganizationSlug: string
  hermesApiUrl?: string
  hermesApiKey?: string
  hermesCliCommand?: string
  fbrAdsApiUrl?: string
  fbrAdsApiKey?: string
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
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    controlTowerApiUrl: env.CONTROL_TOWER_API_URL,
    controlTowerApiKey: env.CONTROL_TOWER_API_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
    controlTowerOrganizationSlug: env.CONTROL_TOWER_ORGANIZATION_SLUG || 'gestaodb',
    hermesApiUrl: env.HERMES_API_URL,
    hermesApiKey: env.HERMES_API_KEY,
    hermesCliCommand: env.HERMES_CLI_COMMAND,
    fbrAdsApiUrl: env.FBR_ADS_API_URL,
    fbrAdsApiKey: env.FBR_ADS_API_KEY,
  }
}

export function assertExternalIntegrationConfigured(config: RuntimeConfig): void {
  if (config.appEnv === 'production' && !config.controlTowerApiUrl) throw new Error('CONTROL_TOWER_API_URL is required in production')
  if (config.appEnv === 'production' && !config.hermesApiUrl && !config.hermesCliCommand) throw new Error('Configure HERMES_API_URL/HERMES_API_KEY or HERMES_CLI_COMMAND in production')
}
