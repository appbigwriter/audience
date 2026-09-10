import { describe, expect, it } from 'vitest'
import { BlogProvisioningSecrets } from '../lib/secrets/blog-provisioning-secrets'
import { EasypanelSecretManager, ReferenceOnlySecretManager, namespaceFor } from '../lib/secrets/secret-manager'
import { BlogService, MockControlTower, MockHermes, MockRepository } from '../lib'

describe('reference-only Secret Manager', () => {
  it('uses a deterministic project UUID namespace', () => {
    expect(namespaceFor('project-uuid')).toBe('fbr/blogs/project-uuid/')
    expect(namespaceFor('project-uuid')).toBe(namespaceFor('project-uuid'))
  })

  it('serializes references without secret values', async () => {
    const receipt = await new BlogProvisioningSecrets(new ReferenceOnlySecretManager()).provision({ projectId: 'p1', schemaName: 'custom_p1', environment: 'development', variableNames: ['SUPABASE_SERVICE_ROLE_KEY'] })
    const serialized = JSON.stringify(receipt)
    expect(serialized).toContain('secret-manager:fbr/blogs/p1/SUPABASE_SERVICE_ROLE_KEY')
    expect(serialized).not.toContain('eyJ')
    expect(receipt.envExample).toContain('<secret-manager:')
  })

  it('fails closed for Easypanel without an official contract', () => {
    expect(() => new EasypanelSecretManager({ apiUrl: 'https://easypanel.test', apiToken: 'not-a-real-token' })).toThrow('official API contract')
  })

  it('runs secret delivery after Control Tower readback and before handoffs', async () => {
    const order: string[] = []
    const tower = { provision: () => { order.push('control-tower'); return { projectId: 'p1', schemaName: 'custom_p1', status: 'active' } } }
    const repo = new MockRepository()
    const original = repo.saveHandoff.bind(repo)
    repo.saveHandoff = ((id: string, name: string) => { order.push(`handoff:${name}`); return original(id, name) }) as typeof repo.saveHandoff
    const result = await new BlogService(repo, new MockHermes(true), tower).createBlog({ name: 'Blog', slug: 'blog', niche: 'n', language: 'pt', voice: 'v' })
    expect(result.namespace).toBe('fbr/blogs/p1/')
    expect(order).toEqual(['control-tower', 'handoff:developer-doc', 'handoff:frontend-adsense-handoff', 'handoff:bigwriter-handoff'])
  })

  it('supports a local smoke without network or values', async () => {
    const result = await new BlogService(new MockRepository(), new MockHermes(true), new MockControlTower()).createBlog({ name: 'Local', slug: 'local', niche: 'n', language: 'pt', voice: 'v' })
    expect(result.secretRefs.every(ref => ref.secretRef.startsWith('secret-manager:fbr/blogs/'))).toBe(true)
    expect(result.developerDoc).not.toMatch(/(eyJ|sk_live|service_role_key=[^<])/i)
  })
})
