/**
 * Track B — AB-S6-005/006 e AB-S9-003/005: modelo de eventos/métricas e dashboards.
 * Dashboard distingue dado REAL (readback), ESTIMATIVA, AUSÊNCIA e STALE; filtros por projeto,
 * conteúdo, canal e período. Health dashboard de projetos mostra status, jobs, blockers, integrações.
 */
export const DASHBOARD_UI_VERSION = 1

export type MetricDatapoint = {
  metricId: string
  projectId: string
  contentId?: string
  channelId?: string
  metric: 'views' | 'clicks' | 'conversions' | 'subscribers' | 'engagement'
  periodStart: string
  periodEnd: string
  value: number
  origin: { kind: 'real-readback' | 'estimate' | 'missing'; readbackAt?: string; source?: string }
}

export type DashboardCard = {
  cardId: string
  title: string
  metric: string
  displayValue: string
  dataQuality: 'real' | 'estimate' | 'missing' | 'stale'
  staleAfterDays: number
  lastReadbackAt?: string
  note?: string
}

const DAY_MS = 86_400_000

function daysSince(isoDate: string | undefined, now: string): number {
  if (!isoDate) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((Date.parse(now) - Date.parse(isoDate)) / DAY_MS))
}

/** Constrói cards distinguindo qualidade do dado; número sem origem/readback nunca é 'real'. */
export function buildDashboardCards(metrics: MetricDatapoint[], now: string): DashboardCard[] {
  return metrics.map(m => {
    let dataQuality: DashboardCard['dataQuality']
    const age = daysSince(m.origin.readbackAt ?? m.periodEnd, now)
    if (m.origin.kind === 'missing') dataQuality = 'missing'
    else if (m.origin.kind === 'estimate') dataQuality = 'estimate'
    else if (m.origin.kind === 'real-readback' && age > 7) dataQuality = 'stale'
    else dataQuality = m.origin.kind === 'real-readback' ? 'real' : 'missing'

    const labels: Record<string, string> = { real: 'dado real (readback)', estimate: 'estimativa', missing: 'sem dado', stale: 'dado antigo' }
    return {
      cardId: `card-${m.metricId}`,
      title: `${m.metric}${m.channelId ? ` · ${m.channelId}` : ''}`,
      metric: m.metric,
      displayValue: dataQuality === 'missing' ? '—' : String(m.value),
      dataQuality,
      staleAfterDays: 7,
      lastReadbackAt: m.origin.readbackAt,
      note: `${labels[dataQuality]} · período ${m.periodStart}..${m.periodEnd}`,
    }
  })
}

export type DashboardFilter = { projectId?: string; contentId?: string; channelId?: string; from?: string; to?: string }

export function filterMetrics(metrics: MetricDatapoint[], filter: DashboardFilter): MetricDatapoint[] {
  return metrics
    .filter(m => (!filter.projectId || m.projectId === filter.projectId))
    .filter(m => (!filter.contentId || m.contentId === filter.contentId))
    .filter(m => (!filter.channelId || m.channelId === filter.channelId))
    .filter(m => (!filter.from || m.periodStart >= filter.from))
    .filter(m => (!filter.to || m.periodEnd <= filter.to))
}

/** AB-S9-003: health dashboard de projetos. */
export type ProjectHealthRow = {
  projectId: string
  name: string
  status: 'draft' | 'intake' | 'persona_bound' | 'planning' | 'provisioning' | 'active' | 'paused' | 'blocked' | 'archived'
  jobs: { total: number; blocked: number; done: number }
  blockers: string[]
  integrations: { name: string; state: 'mock-local' | 'configured' | 'verified' | 'pending' }[]
  metricsAvailable: number
  lastAction: { what: string; at: string; actor: string }
  nextCheck: string
}

export type PortfolioReport = {
  generatedAt: string
  buckets: { active: string[]; blocked: string[]; pilot: string[]; staging: string[]; productionVerified: string[] }
  note: string
}

/** AB-S9-005: relatório de portfólio separa ativos, bloqueados, piloto, staging e produção verificada. */
export function buildPortfolioReport(projects: ProjectHealthRow[], generatedAt: string): PortfolioReport {
  const buckets = {
    active: projects.filter(p => p.status === 'active').map(p => p.projectId),
    blocked: projects.filter(p => p.status === 'blocked' || p.blockers.length > 0).map(p => p.projectId),
    pilot: projects.filter(p => p.status === 'planning' || p.status === 'provisioning').map(p => p.projectId),
    staging: projects.filter(p => p.status === 'persona_bound' && p.integrations.some(i => i.state === 'mock-local')).map(p => p.projectId),
    productionVerified: projects.filter(p => p.status === 'active' && p.blockers.length === 0 && p.integrations.length > 0 && p.integrations.every(i => i.state === 'verified')).map(p => p.projectId),
  }
  return {
    generatedAt,
    buckets,
    note: 'Nenhum projeto em produção verificada até existir readback de provisionamento real (Control Tower).',
  }
}
