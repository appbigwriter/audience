import { describe, it, expect } from 'vitest'
import { validateAuthorityToken, requireAuthorityRole } from '../../lib/auth/authority-guard'

describe('Authority Guard — Autenticação e RBAC', () => {
  const mockEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    APP_ENV: 'test',
    AUTHORITY_ADMIN_TOKEN: 'token-admin-123',
    AUTHORITY_OPERATOR_TOKEN: 'token-operator-123',
    AUTHORITY_REVIEWER_TOKEN: 'token-reviewer-123',
    AUTHORITY_PUBLISHER_TOKEN: 'token-publisher-123',
    AUTHORITY_VIEWER_TOKEN: 'token-viewer-123',
    CONTROL_TOWER_PROJECT_ID: '153d40a6-5823-4029-add3-b52604cd3b71'
  }

  it('rejeita requisições sem Authorization header', () => {
    const res = validateAuthorityToken(null, mockEnv)
    expect(res.authenticated).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('rejeita tokens inválidos', () => {
    const res = validateAuthorityToken('Bearer token-invalido', mockEnv)
    expect(res.authenticated).toBe(false)
    expect(res.statusCode).toBe(403)
  })

  it('autentica token de admin corretamente', () => {
    const res = validateAuthorityToken('Bearer token-admin-123', mockEnv)
    expect(res.authenticated).toBe(true)
    expect(res.role).toBe('admin')
    expect(res.projectId).toBe('153d40a6-5823-4029-add3-b52604cd3b71')
  })

  it('autentica token de operator e valida papel exigido', () => {
    const res = requireAuthorityRole('Bearer token-operator-123', ['operator', 'admin'], mockEnv)
    expect(res.authenticated).toBe(true)
    expect(res.role).toBe('operator')
  })

  it('bloqueia papel não autorizado com 403', () => {
    const res = requireAuthorityRole('Bearer token-viewer-123', ['operator', 'admin'], mockEnv)
    expect(res.authenticated).toBe(false)
    expect(res.statusCode).toBe(403)
    expect(res.error).toContain("Forbidden: role 'viewer'")
  })

  it('permite admin acessar recursos restritos a outros papéis', () => {
    const res = requireAuthorityRole('Bearer token-admin-123', ['publisher'], mockEnv)
    expect(res.authenticated).toBe(true)
    expect(res.role).toBe('admin')
  })
})
