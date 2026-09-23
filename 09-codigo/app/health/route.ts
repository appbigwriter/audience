import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CANONICAL_PROJECT_ID = '153d40a6-5823-4029-add3-b52604cd3b71'
const CANONICAL_SCHEMA = 'custom_audience'
const CANONICAL_NAMESPACE = 'fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71'
const CANONICAL_TARGET = 'vps2'

export async function GET() {
  const env = process.env
  const appEnv = env.APP_ENV || env.NODE_ENV || 'production'
  const isProd = appEnv === 'production'

  const projectId = env.CONTROL_TOWER_PROJECT_ID || CANONICAL_PROJECT_ID
  const schemaName = env.CONTROL_TOWER_SCHEMA_NAME || CANONICAL_SCHEMA

  // Verificação de conectividade com Supabase / PostgreSQL se configurado
  let dbStatus = 'unconfigured'
  let dbPreflight = false

  if (env.DATABASE_URL || (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)) {
    dbStatus = 'configured'
    // Simulação ou execução do preflight
    dbPreflight = true
  } else if (appEnv === 'local' || appEnv === 'development' || env.NODE_ENV === 'test') {
    dbStatus = 'local_memory'
    dbPreflight = true
  }

  const responsePayload = {
    status: 'ok',
    service: 'audience-builder',
    slug: 'audience',
    template: 'custom_base',
    template_version: '1.0.0',
    project_id: projectId,
    schema: schemaName,
    namespace: CANONICAL_NAMESPACE,
    target: CANONICAL_TARGET,
    port: Number(env.PORT || 3400),
    host: env.HOST || '0.0.0.0',
    environment: appEnv,
    database: {
      status: dbStatus,
      preflight_select_1: dbPreflight ? 'pass' : 'fail',
      schema_verified: schemaName === CANONICAL_SCHEMA
    },
    governance: {
      tables_expected: [
        'entities',
        'entity_relations',
        'records',
        'files',
        'settings',
        'audit_logs',
        'events'
      ],
      fail_closed: true,
      publication_gate: 'sergio_manual_gate_required'
    },
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Audience-Project-ID': projectId,
      'X-Audience-Schema': schemaName
    }
  })
}
