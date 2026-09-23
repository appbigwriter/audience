/**
 * Authority Guard — Validação e RBAC para tokens do Authority Engine
 * 
 * Suporta os 5 papéis oficiais definidos no audience-dev-doc:
 * - admin: controle total, provisionamento, deploy, exclusão
 * - operator: criação de jobs, intake, atualização de manifestos
 * - reviewer: revisão editorial, fact-check, SEO e QA
 * - publisher: aprovação de publicação (Gate Sergio)
 * - viewer: leitura somente (dashboards, status, métricas)
 */

export type AuthorityRole = 'admin' | 'operator' | 'reviewer' | 'publisher' | 'viewer'

export interface AuthorityAuthResult {
  authenticated: boolean
  role?: AuthorityRole
  projectId?: string
  error?: string
  statusCode?: number
}

export function validateAuthorityToken(
  authHeader: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env
): AuthorityAuthResult {
  if (!authHeader) {
    return { authenticated: false, error: 'Missing Authorization header', statusCode: 401 }
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()

  if (!token) {
    return { authenticated: false, error: 'Token is empty', statusCode: 401 }
  }

  const adminToken = env.AUTHORITY_ADMIN_TOKEN
  const operatorToken = env.AUTHORITY_OPERATOR_TOKEN
  const reviewerToken = env.AUTHORITY_REVIEWER_TOKEN
  const publisherToken = env.AUTHORITY_PUBLISHER_TOKEN
  const viewerToken = env.AUTHORITY_VIEWER_TOKEN

  if (adminToken && token === adminToken) {
    return { authenticated: true, role: 'admin', projectId: env.CONTROL_TOWER_PROJECT_ID }
  }

  if (operatorToken && token === operatorToken) {
    return { authenticated: true, role: 'operator', projectId: env.CONTROL_TOWER_PROJECT_ID }
  }

  if (reviewerToken && token === reviewerToken) {
    return { authenticated: true, role: 'reviewer', projectId: env.CONTROL_TOWER_PROJECT_ID }
  }

  if (publisherToken && token === publisherToken) {
    return { authenticated: true, role: 'publisher', projectId: env.CONTROL_TOWER_PROJECT_ID }
  }

  if (viewerToken && token === viewerToken) {
    return { authenticated: true, role: 'viewer', projectId: env.CONTROL_TOWER_PROJECT_ID }
  }

  // Em ambiente local/testes, permitir token de teste explícito se configurado
  if (env.APP_ENV === 'local' || env.NODE_ENV === 'test') {
    if (token === 'test-admin-token') {
      return { authenticated: true, role: 'admin', projectId: 'test-project-id' }
    }
    if (token === 'test-viewer-token') {
      return { authenticated: true, role: 'viewer', projectId: 'test-project-id' }
    }
  }

  return { authenticated: false, error: 'Invalid Authority token', statusCode: 403 }
}

export function requireAuthorityRole(
  authHeader: string | null | undefined,
  allowedRoles: AuthorityRole[],
  env: NodeJS.ProcessEnv = process.env
): AuthorityAuthResult {
  const result = validateAuthorityToken(authHeader, env)
  if (!result.authenticated || !result.role) {
    return result
  }

  if (result.role === 'admin') {
    // Admin tem acesso a todos os recursos
    return result
  }

  if (!allowedRoles.includes(result.role)) {
    return {
      authenticated: false,
      role: result.role,
      error: `Forbidden: role '${result.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
      statusCode: 403
    }
  }

  return result
}
