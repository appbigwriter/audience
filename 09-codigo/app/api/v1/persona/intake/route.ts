import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorityRole } from '../../../../../lib/auth/authority-guard'
import { validatePersonaIntakePackage } from '../../../../../packages/contracts/persona-intake'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const auth = requireAuthorityRole(authHeader, ['operator', 'admin'])

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.statusCode || 401 }
    )
  }

  try {
    const payload = await req.json()
    const validation = validatePersonaIntakePackage(payload)

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: 'Invalid Persona Intake Package',
          errors: validation.errors
        },
        { status: 422 }
      )
    }

    const intakeResult = {
      status: 'intake_accepted',
      persona_id: payload.personaId,
      persona_version_id: payload.personaVersionId,
      persona_version: payload.personaVersion,
      content_hash: payload.contentHash,
      approved_by: payload.approval?.approvedBy,
      approved_at: payload.approval?.approvedAt,
      received_at: new Date().toISOString()
    }

    return NextResponse.json(intakeResult, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process persona intake', details: err.message },
      { status: 400 }
    )
  }
}
