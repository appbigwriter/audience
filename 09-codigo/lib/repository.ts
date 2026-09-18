import type { BlogInput, BlogRepository, DailyJob, EditorialConfigRecord, PersonaBindingRecord } from './index'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'

type State = { blogs: Record<string, BlogInput>; agents: Record<string, { profileId: string; status: string }>; handoffs: Array<{ blogId: string; name: string; receipt: string }>; jobs: DailyJob[]; events: Array<{ blogId: string; agent: string; action: string; artifact?: string }>; personaBindings: PersonaBindingRecord[]; editorialConfigs: EditorialConfigRecord[] }
const emptyState = (): State => ({ blogs: {}, agents: {}, handoffs: [], jobs: [], events: [], personaBindings: [], editorialConfigs: [] })

export class JsonRepository implements BlogRepository {
  private state: State
  private readonly path: string
  constructor(path = '.data/fbr-blogs.json') { this.path = isAbsolute(path) ? path : resolve(process.cwd(), path); this.state = this.load() }
  private load(): State { try { const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as Partial<State>; return { ...emptyState(), ...parsed, events: parsed.events || [], personaBindings: parsed.personaBindings || [], editorialConfigs: parsed.editorialConfigs || [] } } catch { return emptyState() } }
  private persist() { mkdirSync(dirname(this.path), { recursive: true }); writeFileSync(this.path, JSON.stringify(this.state, null, 2), 'utf8') }
  saveBlog(input: BlogInput): string { const existing = this.findBlogBySlug(input.slug); if (existing) return existing.id; const id = crypto.randomUUID(); this.state.blogs[id] = input; this.persist(); return id }
  hasBlog(slug: string) { return Boolean(this.findBlogBySlug(slug)) }
  findBlogBySlug(slug: string) { const found = Object.entries(this.state.blogs).find(([, blog]) => blog.slug === slug); return found ? { id: found[0], blog: found[1] } : undefined }
  saveAgent(blogId: string, profileId: string, status = 'validated') { this.state.agents[blogId] = { profileId, status }; this.persist() }
  saveHandoff(blogId: string, name: string, receipt = `local-${crypto.randomUUID()}`) { if (!this.state.handoffs.some(x => x.blogId === blogId && x.name === name)) this.state.handoffs.push({ blogId, name, receipt }); this.persist() }
  saveJobs(jobs: DailyJob[]) { this.state.jobs.push(...jobs); this.persist() }
  saveEvent(blogId: string, agent: string, action: string, artifact?: string) { this.state.events.push({ blogId, agent, action, artifact }); this.persist() }
  getBlog(id: string) { return this.state.blogs[id] }
  findPersonaBinding(key: string) { return this.state.personaBindings.find(x => x.input.idempotencyKey === key || x.input.eventId === key) }
  savePersonaBinding(binding: PersonaBindingRecord) { if (!this.findPersonaBinding(binding.input.idempotencyKey)) { this.state.personaBindings.push(binding); this.persist() } }
  saveEditorialConfig(config: EditorialConfigRecord) { if (!this.state.editorialConfigs.some(x => x.blogId === config.blogId)) { this.state.editorialConfigs.push(config); this.persist() } }
  countJobs(blogId: string) { return this.state.jobs.filter(job => job.blogId === blogId).length }
}

export class SupabaseRepository implements BlogRepository {
  private readonly base: string
  constructor(private readonly url: string, private readonly key: string, private readonly schema = 'public', private readonly fetcher: typeof fetch = fetch) { this.base = `${url.replace(/\/$/, '')}/rest/v1` }
  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetcher(`${this.base}/${path}`, { ...init, headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Profile': this.schema, 'Accept-Profile': this.schema, ...(init.headers || {}) } })
    if (!response.ok) throw new Error(`Supabase repository error (${response.status}) at ${path.split('?')[0]}`)
    return response.status === 204 ? null : response.json()
  }
  private filter(column: string, value: string) { return `${column}=eq.${encodeURIComponent(value)}` }
  async saveBlog(input: BlogInput): Promise<string> {
    const existing = await this.findBlogBySlug(input.slug); if (existing) return existing.id
    const rows = await this.request('blog_config', { method: 'POST', headers: { Prefer: 'return=representation,resolution=ignore-duplicates' }, body: JSON.stringify({ id: crypto.randomUUID(), name: input.name, slug: input.slug, niche: input.niche, language: input.language, voice: input.voice, domain: input.domain ?? null }) }) as Array<{ id: string }>
    if (rows?.[0]?.id) return rows[0].id
    const retry = await this.findBlogBySlug(input.slug); if (retry) return retry.id
    throw new Error('Supabase repository error: blog insert returned no id')
  }
  async hasBlog(slug: string) { return Boolean(await this.findBlogBySlug(slug)) }
  async findBlogBySlug(slug: string) { const rows = await this.request(`blog_config?${this.filter('slug', slug)}&select=id,name,slug,niche,language,voice&limit=1`) as Array<{ id: string } & BlogInput>; return rows[0] ? { id: rows[0].id, blog: rows[0] } : undefined }
  async saveAgent(blogId: string, profileId: string, status = 'validated') { await this.request('blog_agents', { method: 'POST', headers: { Prefer: 'return=minimal,resolution=merge-duplicates' }, body: JSON.stringify({ id: crypto.randomUUID(), blog_id: blogId, role: 'gestor_editorial', profile_id: profileId, validation_status: status }) }) }
  async saveHandoff(blogId: string, name: string, receipt = crypto.randomUUID()) { await this.request('handoff_deliveries', { method: 'POST', headers: { Prefer: 'return=minimal,resolution=merge-duplicates' }, body: JSON.stringify({ id: crypto.randomUUID(), blog_id: blogId, document_name: name, receipt, status: 'delivered' }) }) }
  async saveJobs(jobs: DailyJob[]) { await this.request('editorial_jobs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(jobs.map(job => ({ id: job.id, blog_id: job.blogId, kind: job.kind, status: job.status, owner: 'gestor_editorial', due_at: new Date().toISOString() }))) }) }
  async saveEvent(blogId: string, agent: string, action: string, artifact?: string) { await this.request('workflow_events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id: crypto.randomUUID(), blog_id: blogId, agent, action, artifact: artifact ?? null }) }) }
  async getBlog(id: string) { const rows = await this.request(`blog_config?${this.filter('id', id)}&select=id,name,slug,niche,language,voice&limit=1`) as Array<BlogInput>; return rows[0] }
}

export function createRepository(config: { appEnv: string; localDataPath: string; blogSchema?: string; supabaseUrl?: string; supabaseServiceRoleKey?: string; fetcher?: typeof fetch }): BlogRepository {
  if (config.appEnv === 'local' || config.appEnv === 'development') return new JsonRepository(config.localDataPath)
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) throw new Error('Supabase repository requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; local fallback is disabled')
  return new SupabaseRepository(config.supabaseUrl, config.supabaseServiceRoleKey, config.blogSchema || 'public', config.fetcher)
}
