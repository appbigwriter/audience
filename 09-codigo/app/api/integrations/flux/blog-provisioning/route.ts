import { NextResponse } from 'next/server'
import { getBlogRuntime } from '@/lib/runtime'
import type { AuthorityPersonaBindingInput } from '@/lib'

function authorized(request: Request) {
  const expected = process.env.FBR_BLOGS_SERVICE_TOKEN
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(expected && supplied && supplied === expected)
}

function isContractError(error: unknown): error is { code: string; message: string; httpStatus: number } {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'httpStatus' in error && 'message' in error)
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'service authentication required', code: 'SERVICE_AUTHENTICATION_REQUIRED' }, { status: 401 })
  try {
    const body = await request.json() as AuthorityPersonaBindingInput
    const receipt = await getBlogRuntime().service.bindApprovedPersona(body)
    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    if (isContractError(error)) return NextResponse.json({ error: error.message, code: error.code }, { status: error.httpStatus })
    const message = error instanceof Error ? error.message : 'request failed'
    const code = message.includes('duplicate') ? 'DUPLICATE_SLUG'
      : message.includes('not configured') ? 'BINDING_PERSISTENCE_NOT_CONFIGURED'
      : 'INVALID_REQUEST'
    const status = code === 'DUPLICATE_SLUG' ? 409 : code === 'BINDING_PERSISTENCE_NOT_CONFIGURED' ? 503 : 400
    return NextResponse.json({ error: message, code }, { status })
  }
}
