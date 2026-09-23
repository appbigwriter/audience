import { describe, it, expect } from 'vitest'
import { GET as healthGet } from '../../app/health/route'
import { GET as projectsGet } from '../../app/api/v1/projects/route'
import { POST as intakePost } from '../../app/api/v1/persona/intake/route'
import { POST as manifestPost } from '../../app/api/v1/manifest/route'
import { NextRequest } from 'next/server'
import { fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'
import type { AudienceProjectManifesto } from '../../packages/domain/manifesto'

describe('Audience Builder — Smoke Test de Operabilidade', () => {
  it('1. Valida endpoint /health com preflight e schema custom_audience', async () => {
    const res = await healthGet()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.schema).toBe('custom_audience')
    expect(body.port).toBe(3400)
    expect(body.target).toBe('vps2')
    expect(body.namespace).toBe('fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71')
  })

  it('2. Valida segurança e RBAC em /api/v1/projects', async () => {
    // Sem token deve falhar com 401
    const unauthReq = new NextRequest('http://localhost:3400/api/v1/projects')
    const unauthRes = await projectsGet(unauthReq)
    expect(unauthRes.status).toBe(401)

    // Com token de viewer deve listar projetos
    const authReq = new NextRequest('http://localhost:3400/api/v1/projects', {
      headers: { authorization: 'Bearer test-viewer-token' }
    })
    const authRes = await projectsGet(authReq)
    expect(authRes.status).toBe(200)
    const data = await authRes.json()
    expect(data.projects[0].schema).toBe('custom_audience')
  })

  it('3. Valida fluxo de ingestão e binding de Persona aprovada', async () => {
    const req = new NextRequest('http://localhost:3400/api/v1/persona/intake', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify(fixturePersonaIntakePackage)
    })
    const res = await intakePost(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.status).toBe('intake_accepted')
    expect(data.persona_id).toBe('fixture-persona-ab-001')
  })

  it('4. Valida parsing e validação de Manifesto', async () => {
    const validManifesto: AudienceProjectManifesto = {
      contractVersion: 1,
      projectId: '153d40a6-5823-4029-add3-b52604cd3b71',
      version: 1,
      project: {
        name: 'Audience Builder Pilot',
        slug: 'audience-pilot',
        niche: 'tecnologia',
        language: 'pt-BR',
        region: 'BR',
        businessObjective: 'authority_and_monetization'
      },
      persona: {
        personaId: 'fixture-persona-ab-001',
        personaVersionId: 'fixture-persona-ab-001@v1',
        personaVersion: 1,
        contentHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      editorial: {
        tone: ['próximo', 'didático'],
        pillars: ['automação', 'governança'],
        forbiddenClaims: ['promessa sem fonte'],
        defaultOutput: 'draft'
      },
      blog: {
        template: 'editorial-reference',
        templateVersion: '1.0.0',
        categories: ['guias', 'análises'],
        articleFrequencyPerWeek: 2
      },
      visual: {
        density: 'comfortable',
        imageDirection: 'documentary',
        motion: 'subtle',
        accessibilityLevel: 'AA'
      },
      social: {
        channels: ['instagram'],
        approvalRequired: true
      },
      monetization: {
        affiliateEnabled: true,
        productAdsEnabled: true,
        newsletterEnabled: true
      }
    }

    const req = new NextRequest('http://localhost:3400/api/v1/manifest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ manifesto: validManifesto })
    })
    const res = await manifestPost(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('valid')
    expect(data.content_hash).toBeDefined()
  })
})
