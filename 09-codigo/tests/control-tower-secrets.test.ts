import { describe, expect, it } from 'vitest'
import { ControlTowerSecretManager, type SecretManagerFetcher, namespaceFor } from '../lib/secrets/secret-manager'

const namespace = { projectId: '67065bd9-bef2-4c3c-ac8e-80aa3cb40080', schemaName: 'custom_blog', environment: 'production' as const, namespace: namespaceFor('67065bd9-bef2-4c3c-ac8e-80aa3cb40080'), variableNames: ['SUPABASE_SERVICE_ROLE_KEY'] }

describe('official Control Tower Secret Manager contract', () => {
  it('uses every official path, header and reference-only payload', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fetcher: SecretManagerFetcher = async (url, init) => {
      requests.push({ url: String(url), init })
      const body = String(url).includes('/validate/') ? { valid: true, secret_refs: [] } : { secret_refs: [{ secret_ref: 'secret-manager:fbr/blogs/67065bd9-bef2-4c3c-ac8e-80aa3cb40080/SUPABASE_SERVICE_ROLE_KEY' }] }
      return new Response(JSON.stringify(body), { status: String(url).includes('/namespaces') ? 201 : 200 })
    }
    const manager = new ControlTowerSecretManager({ baseUrl: 'https://supabase-control-tower-api.fbr.news/api/control-tower/', apiKey: 'agent-key', callerService: 'fbr-blogs', environment: 'production', fetcher })
    await manager.createNamespace(namespace.projectId, namespace.schemaName, namespace.environment, namespace.variableNames)
    await manager.getNamespace(namespace.projectId)
    await manager.recordReference(namespace, namespace.variableNames[0])
    expect(await manager.validateInjection(namespace)).toBe(true)
    await manager.rotate(namespace, namespace.variableNames[0], { role: 'operator', actor: 'théo' })
    await manager.revoke(namespace, namespace.variableNames[0], { role: 'operator', actor: 'théo' })
    expect(requests.map(request => new URL(request.url).pathname)).toEqual(['/api/control-tower/secrets/namespaces', '/api/control-tower/secrets/namespaces/67065bd9-bef2-4c3c-ac8e-80aa3cb40080', '/api/control-tower/secrets/bindings', '/api/control-tower/secrets/validate/67065bd9-bef2-4c3c-ac8e-80aa3cb40080', '/api/control-tower/secrets/rotate', '/api/control-tower/secrets/revoke'])
    for (const request of requests) { expect(request.init?.headers).toMatchObject({ Authorization: 'Bearer agent-key', Accept: 'application/json', 'Content-Type': 'application/json', 'x-fbr-environment': 'production', 'x-fbr-caller-service': 'fbr-blogs' }); expect(String(JSON.stringify(request.init?.body))).not.toContain('raw-secret') }
    expect(JSON.stringify(requests)).not.toContain('raw-secret')
  })

  it('accepts 200 and 201 idempotent responses and maps errors safely', async () => {
    let status = 200
    const fetcher: SecretManagerFetcher = async () => new Response('{}', { status })
    const manager = new ControlTowerSecretManager({ baseUrl: 'https://tower.test', apiKey: 'key', callerService: 'fbr-blogs', environment: 'development', fetcher })
    await manager.createNamespace(namespace.projectId, namespace.schemaName, 'development', namespace.variableNames)
    status = 201
    await manager.createNamespace(namespace.projectId, namespace.schemaName, 'development', namespace.variableNames)
    status = 409
    await expect(manager.createNamespace(namespace.projectId, namespace.schemaName, 'development', namespace.variableNames)).rejects.toThrow('error (409)')
    expect((await manager.getRuntimeReferences(namespace))).toEqual([])
  })

  it('requires operator authorization for rotation and revocation', async () => {
    const manager = new ControlTowerSecretManager({ baseUrl: 'https://tower.test', apiKey: 'key', callerService: 'fbr-blogs', environment: 'development', fetcher: async () => new Response('{}') })
    await expect(manager.rotate(namespace, namespace.variableNames[0])).rejects.toThrow('authorized operator')
    await expect(manager.revoke(namespace, namespace.variableNames[0], { role: 'operator', actor: '' })).rejects.toThrow('authorized operator')
  })
})
