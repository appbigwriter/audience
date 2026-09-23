import { describe, it, expect } from 'vitest'
import { GET } from '../../app/health/route'

describe('Endpoint GET /health', () => {
  it('retorna HTTP 200 com payload estruturado conforme audience-dev-doc', async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.service).toBe('audience-builder')
    expect(data.slug).toBe('audience')
    expect(data.project_id).toBe('153d40a6-5823-4029-add3-b52604cd3b71')
    expect(data.schema).toBe('custom_audience')
    expect(data.namespace).toBe('fbr/custom/153d40a6-5823-4029-add3-b52604cd3b71')
    expect(data.target).toBe('vps2')
    expect(data.port).toBe(3400)
    expect(data.governance.fail_closed).toBe(true)
    expect(data.governance.tables_expected).toContain('entities')
    expect(data.governance.tables_expected).toContain('audit_logs')
  })
})
