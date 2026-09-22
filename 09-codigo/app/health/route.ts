import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'audience-builder',
    app: 'Audience Builder',
    environment: process.env.APP_ENV ?? 'unknown',
    persistence: process.env.SUPABASE_URL ? 'configured' : 'not_configured',
    authority: 'pending_readback',
    publication: 'blocked_by_design',
  })
}
