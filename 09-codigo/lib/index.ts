export type BlogInput = { name: string; slug: string; niche: string; language: string; voice: string; domain?: string | null; secretVariableNames?: string[] }
import { BlogProvisioningSecrets, DEFAULT_BLOG_SECRET_VARIABLES } from './secrets/blog-provisioning-secrets'
import { ReferenceOnlySecretManager, type SecretManager, type SecretEnvironment } from './secrets/secret-manager'
export type JobKind = 'niche' | 'affiliate_radar'
export type JobStatus = 'draft' | 'blocked'
export type DailyJob = { id: string; blogId: string; kind: JobKind; status: JobStatus; title: string; bullets: string[]; wordCount: number; ads: { affiliate: string | null; product: string | null }; disclosure: string; keywords: string[]; sources: string[] }
export interface BlogRepository { saveBlog(input: BlogInput): Promise<string> | string; hasBlog(slug: string): Promise<boolean> | boolean; findBlogBySlug?(slug: string): Promise<{ id: string; blog: BlogInput } | undefined> | { id: string; blog: BlogInput } | undefined; saveAgent(blogId: string, profileId: string, status?: string): Promise<void> | void; saveHandoff(blogId: string, name: string, receipt?: string): Promise<void> | void; saveJobs(jobs: DailyJob[]): Promise<void> | void; saveEvent?(blogId: string, agent: string, action: string, artifact?: string): Promise<void> | void; getBlog(id: string): Promise<BlogInput | undefined> | BlogInput | undefined }
export interface HermesAdapter { createManager(input: BlogInput): Promise<{ profileId: string; validated: boolean }> | { profileId: string; validated: boolean }; healthCheck(profileId: string): Promise<boolean> | boolean }
export interface ControlTowerAdapter { provision(input: { name: string; slug: string; businessType: 'custom'; templateKey: 'custom_base'; domain?: string | null; language: string }): Promise<{ projectId: string; schemaName: string; status: string; handoffs?: Record<string, unknown> }> | { projectId: string; schemaName: string; status: string; handoffs?: Record<string, unknown> } }
export interface FbrAdsAdapter { validateCreative(width: number, height: number): boolean; inventory?(query: string): Promise<unknown>; selectCreative?(query: string): Promise<unknown> }
export interface ImageProviderAdapter { source(query: string): { url: string; license: string } }

export class MockRepository implements BlogRepository { blogs = new Map<string, BlogInput>(); agents = new Map<string, string>(); handoffs: string[] = []; jobs: DailyJob[] = []; events: string[] = []; saveBlog(x: BlogInput) { const id = crypto.randomUUID(); this.blogs.set(id, x); return id } hasBlog(slug: string) { return [...this.blogs.values()].some(x => x.slug === slug) } findBlogBySlug(slug: string) { const entry = [...this.blogs.entries()].find(([, blog]) => blog.slug === slug); return entry ? { id: entry[0], blog: entry[1] } : undefined } saveAgent(id: string, p: string) { this.agents.set(id, p) } saveHandoff(id: string, n: string) { this.handoffs.push(`${id}:${n}`) } saveJobs(x: DailyJob[]) { this.jobs.push(...x) } saveEvent(id: string, agent: string, action: string) { this.events.push(`${id}:${agent}:${action}`) } getBlog(id: string) { return this.blogs.get(id) } }
export class MockHermes implements HermesAdapter { constructor(private readonly valid = true) {} createManager(_: BlogInput) { return { profileId: `hermes-manager-${crypto.randomUUID()}`, validated: this.valid } } healthCheck(_: string) { return this.valid } }
export class MockControlTower implements ControlTowerAdapter { calls = 0; provision(x: { slug: string }) { this.calls++; return { projectId: `ct-${x.slug}`, schemaName: `custom_${x.slug}`, status: 'provisioned' } } }
export class MockFbrAds implements FbrAdsAdapter { validateCreative(w: number, h: number) { return (w === 1250 && h === 150) || (w === 350 && h === 350) } }
export class MockImageProvider implements ImageProviderAdapter { source(q: string) { return { url: `mock://image/${encodeURIComponent(q)}`, license: 'local-only' } } }

export class BlogService {
  private readonly secrets: BlogProvisioningSecrets
  constructor(private readonly repo: BlogRepository, private readonly hermes: HermesAdapter, private readonly tower: ControlTowerAdapter, secretManager: SecretManager = new ReferenceOnlySecretManager(), private readonly environment: SecretEnvironment = 'development') { this.secrets = new BlogProvisioningSecrets(secretManager) }
  async createBlog(input: BlogInput) {
    if (!/^[a-z0-9_]+$/.test(input.slug)) throw new Error('invalid slug')
    if (await this.repo.hasBlog(input.slug)) throw new Error('duplicate slug')
    const id = await this.repo.saveBlog(input)
    const manager = await this.hermes.createManager(input)
    await this.repo.saveAgent(id, manager.profileId, manager.validated ? 'validated' : 'blocked')
    if (!manager.validated || !(await this.hermes.healthCheck(manager.profileId))) throw new Error('manager must be validated')
    const project = await this.tower.provision({ name: input.name, slug: input.slug, businessType: 'custom', templateKey: 'custom_base', domain: input.domain ?? null, language: input.language })
    const secretPackage = await this.secrets.provision({ projectId: project.projectId, schemaName: project.schemaName, environment: this.environment, variableNames: input.secretVariableNames ? [...input.secretVariableNames] : [...DEFAULT_BLOG_SECRET_VARIABLES], templateKey: 'custom_base' })
    const handoffs = ['developer-doc', 'frontend-adsense-handoff', 'bigwriter-handoff']
    for (const handoff of handoffs) await this.repo.saveHandoff(id, handoff, project.handoffs?.[handoff] ? `control-tower:${handoff}` : `local-receipt:${crypto.randomUUID()}`)
    return { blogId: id, managerProfileId: manager.profileId, managerStatus: 'validated', projectId: project.projectId, schemaName: project.schemaName, templateKey: 'custom_base', namespace: secretPackage.namespace.namespace, secretRefs: secretPackage.secretRefs, developerDoc: secretPackage.developerDoc, status: project.status, handoffs }
  }
  async dailyRun(blogId: string) {
    if (!(await this.repo.getBlog(blogId))) throw new Error('blog not found')
    const kinds: JobKind[] = ['niche', 'niche', 'affiliate_radar']
    const jobs = kinds.map((kind, i) => ({ id: crypto.randomUUID(), blogId, kind, status: 'draft' as const, title: kind === 'affiliate_radar' ? 'Radar de Afiliados: oportunidade do nicho' : `Guia editorial do nicho ${i + 1}`, bullets: ['contexto factual', 'tendência relevante', 'análise prática', 'próximos passos'], wordCount: 1300, ads: { affiliate: 'affiliate-ad-1', product: 'product-ad-1' }, disclosure: 'Este artigo pode conter links afiliados; podemos receber comissão sem custo adicional.', keywords: ['nicho', 'guia', 'tendências'], sources: ['https://example.com/source'] }))
    await this.repo.saveJobs(jobs)
    return jobs
  }
}
export const fbrAdsFormats = [{ width: 1250, height: 150 }, { width: 350, height: 350 }]
