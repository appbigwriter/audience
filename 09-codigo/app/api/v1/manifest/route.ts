import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorityRole } from '../../../../lib/auth/authority-guard'
import { validateManifesto, computeManifestoHash, type AudienceProjectManifesto } from '../../../../packages/domain/manifesto'

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
    const body = await req.json()
    const manifesto = (body.manifesto || body) as Partial<AudienceProjectManifesto>

    const validation = validateManifesto(manifesto)
    if (!validation.ok) {
      return NextResponse.json(
        { error: 'Manifest schema validation error', errors: validation.errors },
        { status: 422 }
      )
    }

    const contentHash = computeManifestoHash(manifesto as AudienceProjectManifesto)

    return NextResponse.json({
      status: 'valid',
      manifest: manifesto,
      content_hash: contentHash
    }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process manifest', details: err.message },
      { status: 400 }
    )
  }
}
