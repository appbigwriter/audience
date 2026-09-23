import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as intakePost } from '../../app/api/v1/persona/intake/route'
import { GET as projectsGet } from '../../app/api/v1/projects/route'
import { fixturePersonaIntakePackage } from '../../packages/contracts/persona-fixtures'

describe('API v1 Endpoints', () => {
  it('rejeita intake de persona sem token com 401', async () => {
    const req = new NextRequest('http://localhost:3400/api/v1/persona/intake', {
      method: 'POST',
      body: JSON.stringify(fixturePersonaIntakePackage)
    })
    const res = await intakePost(req)
    expect(res.status).toBe(401)
  })

  it('aceita intake de persona com token de admin no ambiente de teste', async () => {
    const req = new NextRequest('http://localhost:3400/api/v1/persona/intake', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify(fixturePersonaIntakePackage)
    })
    const res = await intakePost(req)
    const data = await res.json()
    if (res.status !== 201) {
      console.error('Validation errors:', JSON.stringify(data, null, 2))
    }
    expect(res.status).toBe(201)
    expect(data.status).toBe('intake_accepted')
    expect(data.persona_id).toBe(fixturePersonaIntakePackage.personaId)
  })

  it('lista projetos via GET /api/v1/projects com token de viewer', async () => {
    const req = new NextRequest('http://localhost:3400/api/v1/projects', {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-viewer-token'
      }
    })
    const res = await projectsGet(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.projects).toBeDefined()
    expect(data.projects.length).toBeGreaterThan(0)
    expect(data.projects[0].schema).toBe('custom_audience')
  })
})
