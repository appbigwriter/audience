/**
 * Track B — Wizard de descoberta de canais (S5 UI surface).
 * Orquestra o fluxo de descoberta SEM decidir: sinais → hipóteses → comparação → pacote de recomendação
 * para revisão humana. O canal permanece TBD; nada aqui publica ou cria contas.
 */
import { generateChannelHypotheses, compareChannelCombos, type ProjectSignals, type RecommendationRun, type ComboAnalysis } from '../../../packages/social-ui/src/recommendation'

export const DISCOVERY_WIZARD_VERSION = 1

export type WizardStepId = 'signals' | 'hypotheses' | 'combos' | 'recommendation-report'

export const WIZARD_STEPS: { id: WizardStepId; label: string; description: string }[] = [
  { id: 'signals', label: 'Sinais do projeto', description: 'nicho, audiência, formatos, capacidade e objetivo' },
  { id: 'hypotheses', label: 'Hipóteses de canal', description: 'candidatos ranqueados com sinais e incertezas' },
  { id: 'combos', label: 'Combinações', description: 'comparação por esforço, reuso, risco e custo' },
  { id: 'recommendation-report', label: 'Relatório para decisão', description: 'dados faltantes e recomendação para Gate humano' },
]

export type WizardState = {
  wizardVersion: number
  projectId: string
  step: WizardStepId
  signals: ProjectSignals | null
  run: RecommendationRun | null
  combos: (ComboAnalysis & { versionTag: string })[]
}

export function initWizard(projectId: string): WizardState {
  return { wizardVersion: DISCOVERY_WIZARD_VERSION, projectId, step: 'signals', signals: null, run: null, combos: [] }
}

export function submitSignals(state: WizardState, signals: ProjectSignals): WizardState {
  const run = generateChannelHypotheses(signals)
  return { ...state, step: 'hypotheses', signals, run }
}

export function submitCombos(state: WizardState, combos: { channelIds: string[] }[]): WizardState {
  if (!state.signals) throw new Error('sinais do projeto são obrigatórios antes de comparar combinações')
  const analyzed = compareChannelCombos(state.signals, combos, 'wizard-v1')
  return { ...state, step: 'combos', combos: analyzed }
}

export type DiscoveryReport = {
  reportId: string
  projectId: string
  generatedAt: string
  topCandidates: { channelId: string; label: string; fitScore: number; uncertainties: number; missingData: number }[]
  bestViableCombo: string | null
  dataGaps: string[]
  decisionPending: true
  decisionOwner: 'sergio'
  nextAction: string
  explicitlyNotDecided: string
}

/** Relatório final do wizard: recomendação justificável para revisão humana; decisão não é tomada aqui. */
export function buildDiscoveryReport(state: WizardState, generatedAt: string): DiscoveryReport {
  if (!state.run) throw new Error('execute o fluxo de hipóteses antes de gerar o relatório')
  const top = state.run.candidates.slice(0, 3).map(c => ({
    channelId: c.channelId, label: c.label, fitScore: c.fitScore,
    uncertainties: c.uncertainties.length, missingData: c.missingData.length,
  }))
  const viable = state.combos.filter(c => c.verdict === 'viable')
  const best = [...viable].sort((a, b) => (b.reusePotential - a.reusePotential) || (a.totalEffortHoursPerWeek - b.totalEffortHoursPerWeek))[0]
  return {
    reportId: `discovery-${state.projectId}-${state.run.modelVersion}`,
    projectId: state.projectId,
    generatedAt,
    topCandidates: top,
    bestViableCombo: best ? best.channels.join(' + ') : null,
    dataGaps: state.run.dataGaps,
    decisionPending: true,
    decisionOwner: 'sergio',
    nextAction: 'Sergio revisa o relatório e decide combinação de canais do piloto (ou pede novos dados)',
    explicitlyNotDecided: 'Nenhum canal foi escolhido automaticamente; este relatório é hipótese ranqueada, não decisão.',
  }
}
