import type { ControlTowerAdapter } from '../index'

type Project = { id: string; slug: string; schema_name: string; status: string; business_type?: string; template_key?: string }
type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export class SupabaseControlTowerAdapter implements ControlTowerAdapter {
  constructor(private readonly options: { apiUrl: string; apiKey: string; organizationSlug?: string; handoffBaseUrl?: string; handoffPathTemplate?: string; fetcher?: Fetcher; handoffPaths?: string[] }) {}
  private async request(base: string, path: string, init: RequestInit = {}) {
    const response = await (this.options.fetcher || fetch)(`${base.replace(/\/$/, '')}${path}`, { ...init, headers: { apikey: this.options.apiKey, Authorization: `Bearer ${this.options.apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) } })
    if (!response.ok) throw new Error(`Control Tower error (${response.status}) at ${path.split('?')[0]}`)
    return response.status === 204 ? null : response.json()
  }
  async provision(input: { name: string; slug: string; businessType: 'custom'; templateKey: 'custom_base'; domain?: string | null; language: string }) {
    const base = this.options.apiUrl
    const orgSlug = this.options.organizationSlug || 'gestaodb'
    const orgRows = await this.request(base, `/rest/v1/organizations?slug=eq.${encodeURIComponent(orgSlug)}&select=id,slug&limit=1`) as Array<{ id: string; slug: string }>
    if (!orgRows[0]?.id) throw new Error('Control Tower organization not found')
    const query = `/rest/v1/projects?slug=eq.${encodeURIComponent(input.slug)}&select=id,slug,schema_name,status,business_type,template_key&limit=1`
    const existing = await this.request(base, query) as Project[]
    let project = existing[0]
    if (!project) {
      const created = await this.request(base, '/rest/v1/rpc/provision_project', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ p_organization_id: orgRows[0].id, p_name: input.name, p_slug: input.slug, p_business_type: 'custom', p_template_key: 'custom_base', p_domain: input.domain ?? null, p_language: input.language }) }) as Project | Project[]
      project = Array.isArray(created) ? created[0] : created
    }
    const readback = await this.request(base, query) as Project[]
    project = readback[0] || project
    if (!project?.id || project.slug !== input.slug || project.template_key !== 'custom_base') throw new Error('Control Tower project readback did not match requested project')
    const handoffs: Record<string, unknown> = {}
    const template = this.options.handoffPathTemplate
    if (template && this.options.handoffBaseUrl) {
      for (const name of ['developer-doc', 'frontend-adsense-handoff', 'bigwriter-handoff']) {
        const path = template.replace('{slug}', encodeURIComponent(input.slug)).replace('{name}', encodeURIComponent(name)).replace('{projectId}', encodeURIComponent(project.id))
        handoffs[name] = await this.request(this.options.handoffBaseUrl, path.startsWith('/') ? path : `/${path}`)
      }
    } else if (this.options.handoffPaths?.length) {
      for (const path of this.options.handoffPaths) handoffs[path] = await this.request(base, path)
    }
    return { projectId: project.id, schemaName: project.schema_name, status: project.status, handoffs }
  }
}
