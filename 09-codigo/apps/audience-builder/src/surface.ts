/**
 * Track B — superfície integrada local do Audience Builder.
 *
 * Composes the already validated design, editorial, social and portfolio contracts
 * into a deterministic, accessible HTML surface. It is deliberately a local
 * adapter: it has no persistence, provider calls, publication, or account creation.
 */
import { renderPage, renderPageHtml, type PageContent } from '../../../packages/template-engine/src/renderer'
import { tokensToCssVariables } from '../../../packages/design-system/src/css-variables'
import type { ThemeTokens } from '../../../packages/design-system/src/theme-manifest'
import { buildDashboardCards, type DashboardCard, type ProjectHealthRow } from './dashboards'
import { buildDiscoveryReport, type DiscoveryReport, type WizardState } from './discovery-wizard'
import { calendarView, type CalendarItem } from '../../../packages/editorial-ui/src/calendar'

export const SURFACE_VERSION = 1

export type AudienceBuilderSurfaceInput = {
  projectId: string
  projectName: string
  themeTokens: ThemeTokens
  pageContent: PageContent
  calendar: CalendarItem[]
  wizard: WizardState
  health: ProjectHealthRow[]
  metricsNow: string
  generatedAt: string
}

export type AudienceBuilderSurface = {
  version: number
  projectId: string
  sections: Array<'design' | 'editorial' | 'social' | 'dashboard' | 'health'>
  previewHtml: string
  cssVariables: Record<string, string>
  calendar: CalendarItem[]
  dashboardCards: DashboardCard[]
  discovery: DiscoveryReport
  health: ProjectHealthRow[]
  html: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

function list(items: string[]): string {
  return items.length ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="ab-empty-state">Nenhum item.</p>'
}

/** Builds a deterministic local surface; no action in this function can publish. */
export function buildAudienceBuilderSurface(input: AudienceBuilderSurfaceInput): AudienceBuilderSurface {
  const rendered = renderPage({
    templateId: 'editorial-reference', templateVersion: '1.0.0', pageKind: 'homepage',
    content: input.pageContent,
  })
  const previewHtml = renderPageHtml(rendered)
  const discovery = buildDiscoveryReport(input.wizard, input.generatedAt)
  const dashboardCards = buildDashboardCards([], input.metricsNow)
  const calendar = calendarView(input.calendar, { projectId: input.projectId })
  const cssVariables = tokensToCssVariables(input.themeTokens)
  const blocked = input.health.filter(project => project.blockers.length > 0)

  const html = `<main id="audience-builder" data-surface-version="${SURFACE_VERSION}">
    <header role="banner"><p class="eyebrow">Audience Builder · local surface</p><h1>${escapeHtml(input.projectName)}</h1><p>Planejamento e revisão; nenhuma publicação automática.</p></header>
    <section id="design" aria-labelledby="design-heading"><h2 id="design-heading">Design e editor visual</h2><div data-preview-viewport="desktop">${previewHtml}</div><p>Tokens resolvidos: ${Object.keys(cssVariables).length}. Preview derivado do manifesto local.</p></section>
    <section id="editorial" aria-labelledby="editorial-heading"><h2 id="editorial-heading">Calendário editorial</h2>${list(calendar.map(item => `${item.scheduledFor} · ${item.title} · ${item.status}`))}</section>
    <section id="social" aria-labelledby="social-heading"><h2 id="social-heading">Descoberta social</h2><p>${escapeHtml(discovery.explicitlyNotDecided)}</p>${list(discovery.topCandidates.map((candidate, index) => `${index + 1}. ${candidate.label} · score ${candidate.fitScore}`))}<p role="status">Gate pendente: ${discovery.decisionOwner}.</p></section>
    <section id="dashboard" aria-labelledby="dashboard-heading"><h2 id="dashboard-heading">Dashboard de performance</h2>${list(dashboardCards.map(card => `${card.title} · ${card.displayValue} · ${card.dataQuality}`))}<p>Dados reais exigem readback; ausência não é estimativa.</p></section>
    <section id="health" aria-labelledby="health-heading"><h2 id="health-heading">Health e portfólio</h2><p>${blocked.length} projeto(s) com blocker explícito.</p>${list(input.health.map(project => `${project.name} · ${project.status} · próximo check ${project.nextCheck}`))}</section>
  </main>`

  return {
    version: SURFACE_VERSION, projectId: input.projectId,
    sections: ['design', 'editorial', 'social', 'dashboard', 'health'],
    previewHtml, cssVariables, calendar, dashboardCards, discovery, health: input.health, html,
  }
}
