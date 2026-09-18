import { describe, expect, it } from 'vitest'
import { BlogService, MockControlTower, MockHermes, MockRepository, type AuthorityPersonaBindingInput } from '../lib'

const input = (overrides: Partial<AuthorityPersonaBindingInput> = {}): AuthorityPersonaBindingInput => ({
  contractVersion: 1, idempotencyKey: 'evt-1', eventId: 'evt-1', tenantId: 'tenant-1', fluxProjectId: 'flux-1',
  correlationId: 'corr-1', causationId: null, sourceEventId: 'authority-event-1', authorityProjectId: 'authority-1',
  personaId: 'persona-1', personaVersionId: 'persona-version-1', personaVersion: 3, personaStatus: 'approved',
  personaSnapshotHash: 'sha256:abc', personaApprovalId: 'approval-1', approvedBy: 'sergio', approvedAt: '2026-09-18T00:00:00.000Z',
  approvalScope: 'blog', approvedVersions: ['persona-version-1'],
  blog: { name: 'Cinema', slug: 'cinema', niche: 'filmes', language: 'pt', voice: 'claro' },
  snapshot: {
    snapshotHash: 'sha256:abc', personaName: 'Cinema', bio: 'Bio', positioning: 'Posicionamento', centralPromise: 'Promessa',
    audience: ['adultos'], voice: 'claro', vocabulary: ['filme'], editorialPillars: ['críticas'], priorityTopics: ['cinema'],
    prohibitedTopics: ['pirataria'], guardrails: ['sem claims'], qualityCriteria: ['fontes'], reviewCriteria: ['revisão humana'],
    blogChannelPlan: { objective: 'informar', audience: ['adultos'], formats: ['guia'], cadence: '3/semana', pillars: ['críticas'], disclosure: 'transparência', constraints: [], plan: 'editorial' },
    socialChannelPlan: { versionId: 'social-v1', status: 'planned', objective: 'distribuir', audience: ['adultos'], formats: ['post'], cadence: 'semanal', pillars: ['críticas'], disclosure: 'transparência', constraints: [] },
    youtubeChannelPlan: { versionId: 'youtube-v1', status: 'planned', objective: 'vídeo', audience: ['adultos'], formats: ['vídeo'], cadence: 'mensal', pillars: ['críticas'], disclosure: 'transparência', constraints: [] }
  },
  ...overrides
})

describe('approved persona binding', () => {
  it('persists inherited editorial configuration and returns a sanitized receipt', async () => {
    const repo = new MockRepository()
    const service = new BlogService(repo, new MockHermes(true), new MockControlTower())
    const receipt = await service.bindApprovedPersona(input())
    expect(receipt).toMatchObject({ personaId: 'persona-1', personaVersionId: 'persona-version-1', tenantId: 'tenant-1', status: 'configured' })
    expect(receipt).not.toHaveProperty('snapshot')
    expect(repo.bindings).toHaveLength(1)
    expect(repo.editorialConfigs[0].blogChannelPlan.objective).toBe('informar')
  })

  it('is idempotent for the same event and does not create a second blog or binding', async () => {
    const repo = new MockRepository(); const tower = new MockControlTower()
    const service = new BlogService(repo, new MockHermes(true), tower)
    const first = await service.bindApprovedPersona(input())
    const second = await service.bindApprovedPersona(input())
    expect(second).toEqual(first); expect(repo.bindings).toHaveLength(1); expect(tower.calls).toBe(1)
  })

  it('retains the binding and editorial inheritance across local repository instances', async () => {
    const path = `.data/persona-${crypto.randomUUID()}.json`
    const { unlinkSync } = await import('node:fs')
    try {
      const { JsonRepository } = await import('../lib/repository')
      const first = new JsonRepository(path); const service = new BlogService(first, new MockHermes(true), new MockControlTower())
      await service.bindApprovedPersona(input({ idempotencyKey: 'persisted', eventId: 'persisted' }))
      const second = new JsonRepository(path)
      expect(await second.findPersonaBinding?.('persisted')).toBeTruthy()
    } finally { try { unlinkSync(path) } catch {} }
  })

  it('rejects non-approved personas and mismatched snapshot hashes before persistence', async () => {
    const repo = new MockRepository(); const service = new BlogService(repo, new MockHermes(true), new MockControlTower())
    await expect(service.bindApprovedPersona(input({ personaStatus: 'pending' }))).rejects.toThrow('approved')
    await expect(service.bindApprovedPersona(input({ idempotencyKey: 'evt-2', eventId: 'evt-2', personaSnapshotHash: 'sha256:other' }))).rejects.toThrow('hash')
    expect(repo.bindings).toHaveLength(0)
  })
})
