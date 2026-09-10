import { describe, expect, it } from 'vitest'
import { unlinkSync } from 'node:fs'
import { JsonRepository } from '../lib/repository'
import { BlogService, MockControlTower, MockHermes } from '../lib'
import { SupabaseControlTowerAdapter } from '../lib/control-tower/real-client'

describe('durable repository contract', () => {
  it('retains a blog and jobs across repository instances', async () => {
    const path = `.data/test-${crypto.randomUUID()}.json`
    try {
      const first = new JsonRepository(path)
      const service = new BlogService(first, new MockHermes(true), new MockControlTower())
      const receipt = await service.createBlog({ name: 'Teste', slug: 'teste', niche: 'teste', language: 'pt', voice: 'claro' })
      await service.dailyRun(receipt.blogId)
      const second = new JsonRepository(path)
      expect(second.hasBlog('teste')).toBe(true)
      expect(second.countJobs(receipt.blogId)).toBe(3)
    } finally { try { unlinkSync(path) } catch {} }
  })
})

describe('Control Tower HTTP adapter', () => {
  it('queries org, deduplicates, provisions, reads back and fetches handoffs', async () => {
    const calls: string[] = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      const requestUrl = String(url)
      calls.push(`${init?.method || 'GET'} ${requestUrl}`)
      const body = requestUrl.includes('/rpc/provision_project') ? { id: 'p1', slug: 'cinema', schema_name: 'custom_cinema', status: 'active', template_key: 'custom_base' } : requestUrl.includes('/projects') ? [{ id: 'p1', slug: 'cinema', schema_name: 'custom_cinema', status: 'active', template_key: 'custom_base' }] : [{ id: 'org1', slug: 'gestaodb' }]
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    const adapter = new SupabaseControlTowerAdapter({ apiUrl: 'https://tower.test', apiKey: 'secret', fetcher, handoffPaths: ['/handoffs/developer', '/handoffs/frontend', '/handoffs/bigwriter'] })
    const result = await adapter.provision({ name: 'Cinema', slug: 'cinema', businessType: 'custom', templateKey: 'custom_base', language: 'pt' })
    expect(result.projectId).toBe('p1'); expect(result.schemaName).toBe('custom_cinema')
    expect(calls.some(call => call.includes('/rest/v1/organizations?slug=eq.gestaodb'))).toBe(true)
    expect(calls.some(call => call.includes('/rest/v1/rpc/provision_project'))).toBe(false)
    expect(calls.filter(call => call.includes('/handoffs/'))).toHaveLength(3)
  })
})
