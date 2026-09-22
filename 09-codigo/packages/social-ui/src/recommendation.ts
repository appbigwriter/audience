/**
 * Modelo de adequação e recomendação de canais (AB-S5-003, AB-S5-004, AB-S5-005).
 * Sinais considerados: audiência, comportamento, formato, visual, cadência, objetivo,
 * capacidade de produção e compliance. O sistema gera CANDIDATOS CLASSIFICADOS (hipóteses),
 * nunca decisões irrevogáveis; cada recomendação explica sinais, incertezas e dados faltantes.
 * Nenhum canal é hardcode — o ranking emerge dos dados do catálogo + sinais do projeto.
 */
import { CHANNEL_CATALOG, CHANNEL_CATALOG_VERSION, findChannel, type ChannelRecord } from './capability-map'

export const RECOMMENDATION_MODEL_VERSION = 1

export type ProjectSignals = {
  niche: string
  audienceSkew: 'young' | 'mixed' | 'adult' | 'professional'
  primaryFormats: Array<'short-text' | 'long-text' | 'image' | 'carousel' | 'short-video' | 'long-video' | 'audio'>
  visualDirection?: string
  cadenceCapacityPerWeek: number
  businessObjective: 'authority' | 'traffic' | 'monetization' | 'community'
  productionCapacity: { video: boolean; design: boolean; writing: boolean }
  complianceSensitivity: 'low' | 'medium' | 'high' // ex.: saúde/finanças
}

export type SignalScore = { signal: string; weight: number; raw: number; weighted: number; note: string }
export type Uncertainty = { kind: string; note: string }
export type MissingData = { kind: string; note: string }

export type ChannelCandidate = {
  channelId: string
  label: string
  fitScore: number // 0..100
  signals: SignalScore[]
  uncertainties: Uncertainty[]
  missingData: MissingData[]
  hardBlockers: string[]
  publishableNow: boolean
  rank: number
}

export type RecommendationRun = {
  modelVersion: number
  generatedFrom: { catalogVersion: string; asOf: string }
  candidates: ChannelCandidate[]
  dataGaps: string[]
}

const W = {
  audienceMatch: 22,
  formatMatch: 20,
  cadenceFit: 14,
  objectiveFit: 14,
  productionFit: 16,
  complianceFit: 8,
  effortBudget: 6,
}

function audienceMatch(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  const raw = channel.audienceShape.skew === p.audienceSkew ? 1 : (channel.audienceShape.skew === 'mixed' || p.audienceSkew === 'mixed') ? 0.6 : 0.15
  return {
    signal: 'audienceMatch', weight: W.audienceMatch, raw, weighted: raw * W.audienceMatch,
    note: `canal ${channel.audienceShape.skew} vs projeto ${p.audienceSkew}`,
  }
}

function formatMatch(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  const overlap = channel.formats.filter(f => (p.primaryFormats as string[]).includes(f))
  const raw = channel.formats.length === 0 ? 0.3 : Math.min(1, overlap.length / Math.max(1, Math.min(3, p.primaryFormats.length)))
  return {
    signal: 'formatMatch', weight: W.formatMatch, raw, weighted: raw * W.formatMatch,
    note: overlap.length ? `formatos em comum: ${overlap.join(', ')}` : 'nenhum formato em comum',
  }
}

function cadenceFit(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  const [lo, hi] = channel.cadenceGuidance.healthyPerDay
  const weeklyLo = lo * 7, weeklyHi = hi * 7
  const raw = p.cadenceCapacityPerWeek >= weeklyLo && p.cadenceCapacityPerWeek <= weeklyHi
    ? 1
    : p.cadenceCapacityPerWeek > weeklyHi ? 0.75 : Math.max(0.1, p.cadenceCapacityPerWeek / Math.max(1, weeklyLo))
  return {
    signal: 'cadenceFit', weight: W.cadenceFit, raw, weighted: raw * W.cadenceFit,
    note: `projeto suporta ${p.cadenceCapacityPerWeek}/sem; canal saudável ${lo}-${hi}/dia`,
  }
}

const OBJECTIVE_BIAS: Record<string, Record<string, number>> = {
  authority: { search: 1, 'interest-graph': 0.8, 'follow-graph': 0.5, 'news-feed': 0.6 },
  traffic: { search: 1, 'interest-graph': 0.8, 'follow-graph': 0.5, 'news-feed': 0.6 },
  monetization: { search: 0.9, 'interest-graph': 0.9, 'follow-graph': 0.6, 'news-feed': 0.7 },
  community: { 'follow-graph': 1, 'interest-graph': 0.8, search: 0.4, 'news-feed': 0.7 },
}

function objectiveFit(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  const table = OBJECTIVE_BIAS[p.businessObjective] ?? OBJECTIVE_BIAS.authority
  const raw = table[channel.audienceShape.discoveryBias] ?? 0.5
  return {
    signal: 'objectiveFit', weight: W.objectiveFit, raw, weighted: raw * W.objectiveFit,
    note: `objetivo ${p.businessObjective} × discovery ${channel.audienceShape.discoveryBias}`,
  }
}

function productionFit(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  let raw = 1
  if (channel.operational.requiresVideoProduction && !p.productionCapacity.video) raw = 0
  if (channel.operational.requiresDesignAssets && !p.productionCapacity.design && raw > 0) raw = Math.min(raw, 0.4)
  if (channel.dependencies.includes('copywriting') && !p.productionCapacity.writing) raw = Math.min(raw, 0.3)
  return {
    signal: 'productionFit', weight: W.productionFit, raw, weighted: raw * W.productionFit,
    note: raw === 0 ? 'canal exige produção de vídeo ausente na capacidade' : 'capacidade de produção compatível',
  }
}

function complianceFit(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  let raw = 1
  if (p.complianceSensitivity === 'high') {
    if (channel.channelId === 'tiktok') raw = 0.5
    if (channel.risks.some(r => /moderação|claims/i.test(r))) raw = Math.min(raw, 0.5)
  }
  return {
    signal: 'complianceFit', weight: W.complianceFit, raw, weighted: raw * W.complianceFit,
    note: p.complianceSensitivity === 'high' ? 'nicho sensível: canais com moderação agressiva pontuam menor' : 'sem sensibilidade especial',
  }
}

function effortBudget(channel: ChannelRecord, p: ProjectSignals): SignalScore {
  const capacityHours = p.cadenceCapacityPerWeek * 2 // heurística de esforço disponível
  const raw = channel.operational.recurringEffortHoursPerWeek <= capacityHours ? 1 : Math.max(0.1, capacityHours / channel.operational.recurringEffortHoursPerWeek)
  return {
    signal: 'effortBudget', weight: W.effortBudget, raw, weighted: raw * W.effortBudget,
    note: `esforço ${channel.operational.recurringEffortHoursPerWeek}h/sem vs estimativa disponível ${capacityHours}h`,
  }
}

/** Gera hipóteses de canal classificadas a partir de sinais; sem decisão irrevogável. */
export function generateChannelHypotheses(project: ProjectSignals): RecommendationRun {
  const candidates: ChannelCandidate[] = CHANNEL_CATALOG.map(channel => {
    const signals = [
      audienceMatch(channel, project), formatMatch(channel, project), cadenceFit(channel, project),
      objectiveFit(channel, project), productionFit(channel, project), complianceFit(channel, project),
      effortBudget(channel, project),
    ]
    const totalWeight = signals.reduce((a, s) => a + s.weight, 0)
    const earned = signals.reduce((a, s) => a + s.weighted, 0)
    const fitScore = Math.round((earned / totalWeight) * 100)

    const uncertainties: Uncertainty[] = []
    const missingData: MissingData[] = []
    const hardBlockers: string[] = []

    if (channel.integration.status !== 'official-contract') {
      uncertainties.push({ kind: 'integration', note: `status de integração: ${channel.integration.status} (${channel.integration.notes})` })
      hardBlockers.push(`publicação bloqueada: sem contrato oficial (${channel.integration.status})`)
    }
    if (channel.dataProvenance.asOf < '2026-09') {
      missingData.push({ kind: 'provenance', note: 'dados do catálogo desatualizados' })
    }
    if (project.productionCapacity.video === false && channel.operational.requiresVideoProduction) {
      missingData.push({ kind: 'production', note: 'sem capacidade de vídeo: estimar custo de aquisição antes de decidir' })
    }
    if (!project.visualDirection && channel.operational.requiresDesignAssets) {
      missingData.push({ kind: 'visual', note: 'direção visual do projeto indefinida; assets não especificados' })
    }

    return {
      channelId: channel.channelId, label: channel.label, fitScore, signals,
      uncertainties, missingData, hardBlockers,
      publishableNow: channel.integration.status === 'official-contract' && hardBlockers.length === 0,
      rank: 0,
    }
  })

  candidates.sort((a, b) => b.fitScore - a.fitScore || a.channelId.localeCompare(b.channelId))
  candidates.forEach((c, i) => { c.rank = i + 1 })

  const dataGaps = [...new Set(candidates.flatMap(c => c.missingData.map(m => m.kind)))].sort()
  return {
    modelVersion: RECOMMENDATION_MODEL_VERSION,
    generatedFrom: { catalogVersion: CHANNEL_CATALOG_VERSION, asOf: '2026-09-22' },
    candidates,
    dataGaps,
  }
}

/** Comparação de combinações de canais (AB-S5-005): alcance potencial × esforço × reutilização × risco × custo. */
export type ChannelComboInput = { channelIds: string[] }

export type ComboAnalysis = {
  channels: string[]
  totalEffortHoursPerWeek: number
  totalSetupHours: number
  costLevel: 'free' | 'low' | 'medium' | 'high'
  reusePotential: number // 0..1
  riskCount: number
  blockedCount: number
  reachPotential: 'low' | 'medium' | 'high'
  verdict: 'viable' | 'stretched' | 'not-viable'
  notes: string[]
}

const COST_ORDER = ['free', 'low', 'medium', 'high'] as const

export function compareChannelCombos(project: ProjectSignals, combos: ChannelComboInput[], versionTag = 'v1'): (ComboAnalysis & { versionTag: string })[] {
  return combos.map(combo => {
    const channels = combo.channelIds.map(id => findChannel(id)).filter((c): c is ChannelRecord => Boolean(c))
    const unknown = combo.channelIds.filter(id => !findChannel(id))
    const notes: string[] = []
    if (unknown.length) notes.push(`canais desconhecidos ignorados: ${unknown.join(', ')}`)

    const totalEffortHoursPerWeek = channels.reduce((a, c) => a + c.operational.recurringEffortHoursPerWeek, 0)
    const totalSetupHours = channels.reduce((a, c) => a + c.operational.estimatedSetupEffortHours, 0)
    const costIdx = Math.max(...channels.map(c => COST_ORDER.indexOf(c.operational.monetaryCostLevel)), 0)
    const costLevel = COST_ORDER[costIdx]

    const formatSets = channels.map(c => new Set(c.formats))
    let overlapSum = 0
    for (let i = 0; i < formatSets.length; i++) {
      for (let j = i + 1; j < formatSets.length; j++) {
        const shared = [...formatSets[i]].filter(f => formatSets[j].has(f))
        overlapSum += shared.length > 0 ? 1 : 0
      }
    }
    const pairs = (channels.length * (channels.length - 1)) / 2
    const reusePotential = pairs === 0 ? 1 : Math.min(1, overlapSum / pairs)

    const riskCount = channels.reduce((a, c) => a + c.risks.length, 0)
    const blockedCount = channels.filter(c => c.integration.status !== 'official-contract').length

    const searchBias = channels.filter(c => c.audienceShape.discoveryBias === 'search').length
    const interestBias = channels.filter(c => c.audienceShape.discoveryBias === 'interest-graph').length
    const reachPotential = searchBias + interestBias >= 2 ? 'high' : searchBias + interestBias === 1 ? 'medium' : 'low'

    const capacityHours = project.cadenceCapacityPerWeek * 2
    let verdict: ComboAnalysis['verdict'] = 'viable'
    if (totalEffortHoursPerWeek > capacityHours * 1.5) verdict = 'not-viable'
    else if (totalEffortHoursPerWeek > capacityHours) verdict = 'stretched'

    if (verdict !== 'viable') notes.push(`esforço ${totalEffortHoursPerWeek}h/sem excede estimativa disponível ${capacityHours}h`)
    if (blockedCount === channels.length && channels.length > 0) notes.push('todos os canais da combinação estão sem contrato oficial: combinação é hipótese de descoberta, não plano de publicação')

    return { channels: combo.channelIds, totalEffortHoursPerWeek, totalSetupHours, costLevel, reusePotential, riskCount, blockedCount, reachPotential, verdict, notes, versionTag }
  })
}
