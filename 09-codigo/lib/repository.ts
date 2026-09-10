import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import type { BlogInput, BlogRepository, DailyJob } from './index'
type State = { blogs: Record<string, BlogInput>; agents: Record<string, { profileId: string; status: string }>; handoffs: Array<{ blogId: string; name: string; receipt: string }>; jobs: DailyJob[] }
const emptyState = (): State => ({ blogs: {}, agents: {}, handoffs: [], jobs: [] })
export class JsonRepository implements BlogRepository {
  private state: State; private readonly path: string
  constructor(path = '.data/fbr-blogs.json') { this.path = isAbsolute(path) ? path : resolve(process.cwd(), path); this.state = this.load() }
  private load(): State { try { return { ...emptyState(), ...JSON.parse(readFileSync(this.path, 'utf8')) } } catch { return emptyState() } }
  private persist() { mkdirSync(dirname(this.path), { recursive: true }); writeFileSync(this.path, JSON.stringify(this.state, null, 2), 'utf8') }
  saveBlog(input: BlogInput): string { const id = crypto.randomUUID(); this.state.blogs[id] = input; this.persist(); return id }
  hasBlog(slug: string) { return Object.values(this.state.blogs).some(blog => blog.slug === slug) }
  findBlogBySlug(slug: string) { const found = Object.entries(this.state.blogs).find(([, blog]) => blog.slug === slug); return found ? { id: found[0], blog: found[1] } : undefined }
  saveAgent(blogId: string, profileId: string, status = 'validated') { this.state.agents[blogId] = { profileId, status }; this.persist() }
  saveHandoff(blogId: string, name: string, receipt = `local-${crypto.randomUUID()}`) { this.state.handoffs.push({ blogId, name, receipt }); this.persist() }
  saveJobs(jobs: DailyJob[]) { this.state.jobs.push(...jobs); this.persist() }
  getBlog(id: string) { return this.state.blogs[id] }
  countJobs(blogId: string) { return this.state.jobs.filter(job => job.blogId === blogId).length }
}
export class SupabaseRepository implements BlogRepository {
  constructor(private readonly url: string, private readonly key: string, private readonly schema = 'custom_fbr_blogs') {}
  private async request(path: string, init: RequestInit = {}) { const response = await fetch(`${this.url.replace(/\/$/, '')}/rest/v1/${path}`, { ...init, headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Profile': this.schema, 'Accept-Profile': this.schema, ...(init.headers || {}) } }); if (!response.ok) throw new Error(`Supabase repository request failed (${response.status})`); return response.status === 204 ? null : response.json() }
  async saveBlog(input: BlogInput): Promise<string> { const rows = await this.request('blog_config', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: input.name, slug: input.slug, niche: input.niche, language: input.language, voice: input.voice, domain: input.domain ?? null }) }) as Array<{ id: string }>; if (!rows?.[0]?.id) throw new Error('Supabase did not return blog id'); return rows[0].id }
  async hasBlog(slug: string) { const rows = await this.request(`blog_config?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`) as unknown[]; return rows.length > 0 }
  async findBlogBySlug(slug: string) { const rows = await this.request(`blog_config?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug,niche,language,voice,domain&limit=1`) as Array<{ id: string } & BlogInput>; return rows[0] ? { id: rows[0].id, blog: rows[0] } : undefined }
  async saveAgent(blogId: string, profileId: string, status = 'validated') { await this.request('blog_agents', { method: 'POST', body: JSON.stringify({ blog_id: blogId, role: 'gestor_editorial', profile_id: profileId, validation_status: status }) }) }
  async saveHandoff(blogId: string, name: string, receipt = crypto.randomUUID()) { await this.request('handoff_deliveries', { method: 'POST', body: JSON.stringify({ blog_id: blogId, document_name: name, receipt, status: 'delivered' }) }) }
  async saveJobs(jobs: DailyJob[]) { await this.request('editorial_jobs', { method: 'POST', body: JSON.stringify(jobs.map(job => ({ id: job.id, blog_id: job.blogId, kind: job.kind, status: job.status, owner: 'gestor_editorial', due_at: new Date().toISOString() }))) }) }
  async getBlog(id: string) { const rows = await this.request(`blog_config?id=eq.${encodeURIComponent(id)}&select=name,slug,niche,language,voice,domain&limit=1`) as BlogInput[]; return rows[0] }
}
export function createRepository(config: { appEnv: string; localDataPath: string; supabaseUrl?: string; supabaseServiceRoleKey?: string }): BlogRepository { if (config.appEnv === 'local' || config.appEnv === 'development') return new JsonRepository(config.localDataPath); if (!config.supabaseUrl || !config.supabaseServiceRoleKey) throw new Error('Supabase repository requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); return new SupabaseRepository(config.supabaseUrl, config.supabaseServiceRoleKey) }
