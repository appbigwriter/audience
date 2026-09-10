import { describe, expect, it } from 'vitest'
import { SupabaseRepository, createRepository } from '../lib/repository'
import { getRuntimeConfig, assertExternalIntegrationConfigured } from '../lib/config'

describe('production integration boundaries', () => {
  it('fails closed without production providers', () => {
    expect(() => getRuntimeConfig({ APP_ENV: 'production' } as unknown as NodeJS.ProcessEnv)).toThrow('SUPABASE')
    expect(() => createRepository({ appEnv: 'production', localDataPath: '.data/x' })).toThrow('local fallback is disabled')
    expect(() => assertExternalIntegrationConfigured({ appEnv: 'production', localDataPath: '.data/x', blogSchema: 'custom_x', controlTowerOrganizationSlug: 'gestaodb' })).toThrow('CONTROL_TOWER')
  })

  it('uses schema profiles, encoded filters and write Prefer headers', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init })
      const body = !init?.method ? [] : [{ id: 'blog-1', name: 'A', slug: 'a b', niche: 'n', language: 'pt', voice: 'v' }]
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    const repo = new SupabaseRepository('https://supabase.test', 'test-key', 'custom_x', fetcher)
    await repo.saveBlog({ name: 'A', slug: 'a b', niche: 'n', language: 'pt', voice: 'v' })
    const post = requests.find(request => request.init?.method === 'POST')
    expect(post?.url).toContain('/rest/v1/blog_config')
    expect(post?.init?.headers).toMatchObject({ 'Content-Profile': 'custom_x', 'Accept-Profile': 'custom_x', Prefer: 'return=representation,resolution=ignore-duplicates' })
    expect(requests[0].url).toContain('slug=eq.a%20b')
  })

  it('selects JSON only for local/development and does not require network', () => {
    expect(createRepository({ appEnv: 'local', localDataPath: `.data/smoke-${crypto.randomUUID()}.json` }).constructor.name).toBe('JsonRepository')
    expect(createRepository({ appEnv: 'development', localDataPath: `.data/smoke-${crypto.randomUUID()}.json` }).constructor.name).toBe('JsonRepository')
  })
})
