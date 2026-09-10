import type { ControlTowerAdapter } from '../index'

type Project = { id: string; slug: string; schema_name: string; status: string; business_type?: string; template_key?: string }
export class SupabaseControlTowerAdapter implements ControlTowerAdapter {
  constructor(private readonly options: { apiUrl: string; apiKey: string; organizationSlug?: string; fetcher?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>; handoffPaths?: string[] }) {}
  private async request(path: string, init: RequestInit = {}) { const response = await (this.options.fetcher || fetch)(`${this.options.apiUrl.replace(/\/$/, '')}${path}`, { ...init, headers: { apikey: this.options.apiKey, Authorization: `Bearer ${this.options.apiKey}`, 'Content-Type': 'application/json', ...(init.headers || {}) } }); if (!response.ok) throw new Error(`Control Tower request failed (${response.status})`); return response.status === 204 ? null : response.json() }
  async provision(input: { name: string; slug: string; businessType: 'custom'; templateKey: 'custom_base'; domain?: string | null; language: string }) {
    const orgRows = await this.request(`/rest/v1/organizations?slug=eq.${encodeURIComponent(this.options.organizationSlug || 'gestaodb')}&select=id,slug`) as Array<{ id: string; slug: string }>
    if (!orgRows[0]) throw new Error('Control Tower organization not found')
    const existing = await this.request(`/rest/v1/projects?slug=eq.${encodeURIComponent(input.slug)}&select=id,slug,schema_name,status,business_type,template_key&limit=1`) as Project[]
    let project = existing[0]
    if (!project) {
      const created = await this.request('/rest/v1/rpc/provision_project', { method: 'POST', body: JSON.stringify({ name: input.name, slug: input.slug, business_type: input.businessType, template_key: input.templateKey, domain: input.domain ?? null, language: input.language, organization_slug: this.options.organizationSlug || 'gestaodb' }) }) as Project | Project[]
      project = Array.isArray(created) ? created[0] : created
    }
    const readback = await this.request(`/rest/v1/projects?slug=eq.${encodeURIComponent(input.slug)}&select=id,slug,schema_name,status,business_type,template_key&limit=1`) as Project[]
    project = readback[0] || project
    if (!project?.id || project.slug !== input.slug || project.template_key !== input.templateKey) throw new Error('Control Tower project readback did not match requested project')
    const handoffPaths = this.options.handoffPaths || []
    const handoffs: Record<string, unknown> = {}
    for (const path of handoffPaths) handoffs[path] = await this.request(path)
    return { projectId: project.id, schemaName: project.schema_name, status: project.status, handoffs }
  }
}
