import { describe, expect, it } from 'vitest'
import {
  fakeAuthorityEvent,
  fakeAuthorityReadModel,
  fakeFluxBindingRequest,
  expectedReceiptFields,
  forbiddenInSanitizedReadback,
} from './fixtures/authority-blogs-flux-fixture'
import { BlogService, MockControlTower, MockHermes, MockRepository, type AuthorityPersonaBindingInput } from '../lib'
import { POST as provisionBlog } from '../app/api/integrations/flux/blog-provisioning/route'

/**
 * Contract test for the v1 Authority → Flux → Blogs adapter contract
 * (`03-arquitetura/authority-blogs-flux-adapter-contract-v1.md`).
 *
 * Proves, entirely with local fakes (no network, no secrets):
 * 1. the ID-only persona.approved event reconciles with the Blogs full-snapshot
 *    binding via the Authority approved read model;
 * 2. the exact v1 payload validates against `validateAuthorityPersonaBinding`;
 * 3. auth placeholder semantics: missing/absent FBR_BLOGS_SERVICE_TOKEN fails closed (401);
 * 4. idempotency: same event replays return the original sanitized receipt;
 * 5. error codes: each failure class maps to its contract HTTP status;
 * 6. sanitized readback: receipts expose metadata only.
 */

const serviceToken = 'fixture-service-token'

function makeRequest(body: unknown, token?: string) {
  return new Request('http://local.test/api/integrations/flux/blog-provisioning', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

/** Mirrors the Flux adapter's v1 enrichment step: event IDs + approved read model → binding request. */
function fluxAssembleBindingRequest(event: typeof fakeAuthorityEvent, readModel: typeof fakeAuthorityReadModel) {
  return {
    ...fakeFluxBindingRequest,
    idempotencyKey: event.event_id,
    eventId: event.event_id,
    correlationId: event.correlation_id,
    causationId: event.causation_id,
    sourceEventId: event.event_id,
    personaId: event.payload.persona_id,
    personaVersionId: event.payload.persona_version_id,
    personaVersion: readModel.persona_version,
    personaSnapshotHash: `sha256:${readModel.content_hash}`,
    approvedVersions: [readModel.persona_version_id],
  }
}

const hasForbiddenKeys = (value: unknown, forbidden: string[], path = ''): string[] => {
  if (Array.isArray(value)) return value.flatMap((item, i) => hasForbiddenKeys(item, forbidden, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      forbidden.includes(key) || forbidden.includes(key.toLowerCase())
        ? [path ? `${path}.${key}` : key]
        : hasForbiddenKeys(item, forbidden, path ? `${path}.${key}` : key))
  }
  return []
}

describe('v1 Authority/Blogs/Flux adapter contract — reconciliation', () => {
  it('assembles the binding request from the ID-only event plus the approved read model', () => {
    const request = fluxAssembleBindingRequest(fakeAuthorityEvent, fakeAuthorityReadModel)
    // every ID in the event maps 1:1 onto the binding request
    expect(request.idempotencyKey).toBe(fakeAuthorityEvent.event_id)
    expect(request.eventId).toBe(fakeAuthorityEvent.event_id)
    expect(request.personaId).toBe(fakeAuthorityEvent.payload.persona_id)
    expect(request.personaVersionId).toBe(fakeAuthorityEvent.payload.persona_version_id)
    // the snapshot hash binds the request to exactly the approved read model content
    expect(request.personaSnapshotHash).toBe(`sha256:${fakeAuthorityReadModel.content_hash}`)
    expect(request.approvedVersions).toContain(fakeAuthorityReadModel.persona_version_id)
    expect(request.personaStatus).toBe('approved')
    expect(request.contractVersion).toBe(1)
  })

  it('accepts the v1 payload through the Blogs validation boundary', async () => {
    const request = fluxAssembleBindingRequest(fakeAuthorityEvent, fakeAuthorityReadModel) as AuthorityPersonaBindingInput
    expect(() => BlogService.prototype, ).toBeDefined() // sanity: service symbols imported
    const repo = new MockRepository()
    const service = new BlogService(repo, new MockHermes(true), new MockControlTower())
    await expect(service.bindApprovedPersona(request)).resolves.toBeDefined()
    expect(repo.bindings).toHaveLength(1)
  })
})

describe('v1 adapter contract — service auth placeholder semantics (fail-closed)', () => {
  it('rejects with 401 when FBR_BLOGS_SERVICE_TOKEN is not configured', async () => {
    const previous = process.env.FBR_BLOGS_SERVICE_TOKEN
    delete process.env.FBR_BLOGS_SERVICE_TOKEN
    try {
      const response = await provisionBlog(makeRequest(fakeFluxBindingRequest, 'any-token'))
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('service authentication required')
    } finally {
      if (previous !== undefined) process.env.FBR_BLOGS_SERVICE_TOKEN = previous
    }
  })

  it('rejects with 401 when the bearer token does not match', async () => {
    const previous = process.env.FBR_BLOGS_SERVICE_TOKEN
    process.env.FBR_BLOGS_SERVICE_TOKEN = serviceToken
    try {
      const response = await provisionBlog(makeRequest(fakeFluxBindingRequest, 'wrong-token'))
      expect(response.status).toBe(401)
    } finally {
      if (previous !== undefined) process.env.FBR_BLOGS_SERVICE_TOKEN = previous
      else delete process.env.FBR_BLOGS_SERVICE_TOKEN
    }
  })

  it('accepts the fixture request when the bearer token matches the placeholder', async () => {
    const previous = process.env.FBR_BLOGS_SERVICE_TOKEN
    const previousAppEnv = process.env.APP_ENV
    process.env.APP_ENV = 'local'
    process.env.FBR_BLOGS_SERVICE_TOKEN = serviceToken
    const previousDataPath = process.env.BLOG_LOCAL_DATA_PATH
    process.env.BLOG_LOCAL_DATA_PATH = `.data/contract-test-${crypto.randomUUID()}.json`
    try {
      const response = await provisionBlog(makeRequest(fakeFluxBindingRequest, serviceToken))
      expect(response.status).toBe(201)
      const receipt = await response.json()
      expect(receipt).toMatchObject(expectedReceiptFields)
      expect(receipt.receiptId).toMatch(/^receipt:/)
      expect(receipt.blogId).toBeTruthy()
    } finally {
      if (previous !== undefined) process.env.FBR_BLOGS_SERVICE_TOKEN = previous
      else delete process.env.FBR_BLOGS_SERVICE_TOKEN
      if (previousAppEnv !== undefined) process.env.APP_ENV = previousAppEnv
      else delete process.env.APP_ENV
      if (previousDataPath !== undefined) process.env.BLOG_LOCAL_DATA_PATH = previousDataPath
      else delete process.env.BLOG_LOCAL_DATA_PATH
    }
  })
})

describe('v1 adapter contract — idempotency', () => {
  it('replays the same event without creating a second blog, binding or provisioning call', async () => {
    const repo = new MockRepository()
    const tower = new MockControlTower()
    const service = new BlogService(repo, new MockHermes(true), tower)
    const request = fluxAssembleBindingRequest(fakeAuthorityEvent, fakeAuthorityReadModel) as AuthorityPersonaBindingInput
    const first = await service.bindApprovedPersona(request)
    const second = await service.bindApprovedPersona(request)
    expect(second).toEqual(first)
    expect(repo.bindings).toHaveLength(1)
    expect(tower.calls).toBe(1)
    expect(first).toMatchObject(expectedReceiptFields)
  })
})

describe('v1 adapter contract — error codes', () => {
  it('maps every contract failure class to its v1 HTTP status via the route', async () => {
    const previous = process.env.FBR_BLOGS_SERVICE_TOKEN
    const previousAppEnv = process.env.APP_ENV
    process.env.APP_ENV = 'local'
    process.env.FBR_BLOGS_SERVICE_TOKEN = serviceToken
    try {
      const cases: Array<{ override: Partial<AuthorityPersonaBindingInput>; expectedStatus: number; match: RegExp }> = [
        { override: { personaStatus: 'pending' }, expectedStatus: 422, match: /approved/ },
        { override: { personaSnapshotHash: 'sha256:deadbeef' }, expectedStatus: 422, match: /hash/ },
        { override: { approvedVersions: ['fixture-persona-version-2'] }, expectedStatus: 422, match: /version/ },
        { override: { contractVersion: 2 }, expectedStatus: 422, match: /contract version/ },
        { override: { approvedBy: '' }, expectedStatus: 422, match: /approval/ },
        { override: { blog: { ...fakeFluxBindingRequest.blog, slug: 'cinema_com_evidencia' } }, expectedStatus: 409, match: /duplicate/ },
      ]
      // first provision the canonical blog so the duplicate-slug case has a target
      const repo = new MockRepository()
      const service = new BlogService(repo, new MockHermes(true), new MockControlTower())
      await service.bindApprovedPersona(fakeFluxBindingRequest as AuthorityPersonaBindingInput)

      for (const { override, expectedStatus, match } of cases) {
        const mutated = { ...fakeFluxBindingRequest, ...override, idempotencyKey: `evt-${expectedStatus}-${Math.random()}`, eventId: `evt-${expectedStatus}-${Math.random()}` }
        // duplicate-slug keeps the canonical slug; all others get fresh event ids
        const response = await provisionBlog(makeRequest(mutated, serviceToken))
        expect(response.status).toBe(expectedStatus)
        const body = await response.json()
        expect(body.error).toMatch(match)
      }
    } finally {
      if (previous !== undefined) process.env.FBR_BLOGS_SERVICE_TOKEN = previous
      else delete process.env.FBR_BLOGS_SERVICE_TOKEN
      if (previousAppEnv !== undefined) process.env.APP_ENV = previousAppEnv
      else delete process.env.APP_ENV
    }
  })
})

describe('v1 adapter contract — sanitized readback', () => {
  it('returns metadata-only receipts with no snapshot body or secret-like keys', async () => {
    const repo = new MockRepository()
    const service = new BlogService(repo, new MockHermes(true), new MockControlTower())
    const receipt = await service.bindApprovedPersona(fakeFluxBindingRequest as AuthorityPersonaBindingInput)
    const violations = hasForbiddenKeys(receipt, forbiddenInSanitizedReadback)
    expect(violations).toEqual([])
    expect(JSON.stringify(receipt)).not.toContain('fixture-module-run')
    expect(JSON.stringify(receipt)).not.toContain('source_run_ids')
    expect(Object.keys(receipt).sort()).toEqual([
      'bindingStatus', 'blogId', 'correlationId', 'eventId', 'fluxProjectId',
      'personaId', 'personaVersionId', 'receiptId', 'status', 'tenantId',
    ])
  })
})
