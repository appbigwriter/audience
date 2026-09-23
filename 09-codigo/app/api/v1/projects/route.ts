import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorityRole } from '../../../../lib/auth/authority-guard'
import { createAudienceProject, type CreateAudienceProjectInput } from '../../../../packages/domain/audience-project'
import type { PersonaIntakePackage } from '../../../../packages/contracts/persona-intake'
import type { PersistenceReadbackCapability } from '../../../../packages/contracts/persistence-contract'

export const dynamic = 'force-dynamic'

const defaultPersistence: PersistenceReadbackCapability = {
  contractVersion: 1,
  readbackSupported: true,
  tenantScopeRequired: true,
  backend: 'postgres'
}

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
    const body = await req.json()
    const input = (body.project || body) as CreateAudienceProjectInput
    const personaPackage = body.personaPackage as PersonaIntakePackage

    if (!personaPackage) {
      return NextResponse.json(
        { error: 'personaPackage is required to create an Audience Project' },
        { status: 422 }
      )
    }

    const project = createAudienceProject(input, personaPackage, defaultPersistence, {
      target: process.env.APP_ENV === 'production' ? 'production' : 'local'
    })

    return NextResponse.json(project, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to create Audience Project', details: err.message },
      { status: 400 }
    )
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const auth = requireAuthorityRole(authHeader, ['viewer', 'reviewer', 'operator', 'admin'])

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.statusCode || 401 }
    )
  }

  return NextResponse.json({
    projects: [
      {
        id: '153d40a6-5823-4029-add3-b52604cd3b71',
        slug: 'audience',
        name: 'Audience Builder Pilot',
        status: 'draft',
        schema: 'custom_audience',
        namespace: 'fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71',
        created_at: new Date().toISOString()
      }
    ]
  })
}
