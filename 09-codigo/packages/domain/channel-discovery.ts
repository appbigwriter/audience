/**
 * SPRINT S5 (backend) — Descoberta de canais: capability map, sinais de
 * adequação, hipóteses de canal e comparação de combinações.
 *
 * Regra central: o sistema gera CANDIDATOS classificados com justificativa,
 * nunca decisões irrevogáveis; canal não é escolhido antecipadamente.
 */
import { computeContentHash, FieldValidator, nowIso, type ValidationResult } from '../contracts/common'

// ---------------------------------------------------------------------------
// AB-S5-001/002 — capability map por canal
// ---------------------------------------------------------------------------

export type ChannelCapability = {
  channel: string
  /** formatos aceitos pelo canal */
  formats: string[]
  /** limites conhecidos (ex.: caracteres, duração) */
  limits: string[]
  /** frequência recomendada */
  cadence: string
  /** dependências operacionais (conta, assets, vídeo, API...) */
  dependencies: string[]
  metrics: string[]
  risks: string[]
  /** integração disponível? contrato oficial é obrigatório para 'available' */
  integration: 'available' | 'planned' | 'unavailable'
  /** requisitos operacionais: custo/esforço estimados em escala própria */
  operationalCost: 'low' | 'medium' | 'high'
  /** dados externos precisam fonte+data */
  dataProvenance: Array<{ field: string; source: string; retrievedAt: string }>
}

export function validateChannelCapability(c: Partial<ChannelCapability> | null | undefined): ValidationResult {
  const v = new FieldValidator()
  if (!c) { v.add('capability', 'REQUIRED', 'capability is required'); return v.result() }
  v.require('channel', c.channel)
  v.requireNonEmptyArray('formats', c.formats)
  v.requireNonEmptyArray('limits', c.limits)
  v.require('cadence', c.cadence)
  v.requireNonEmptyArray('dependencies', c.dependencies)
  v.requireNonEmptyArray('metrics', c.metrics)
  v.requireNonEmptyArray('risks', c.risks)
  v.enum('integration', c.integration, ['available', 'planned', 'unavailable'] as const)
  v.enum('operationalCost', c.operationalCost, ['low', 'medium', 'high'] as const)
  if (!Array.isArray(c.dataProvenance) || c.dataProvenance.length === 0) v.add('dataProvenance', 'REQUIRED_NON_EMPTY', 'dados externos exigem fonte/data')
  else {
    c.dataProvenance.forEach((p, i) => {
      if (!p?.source || !p?.retrievedAt) v.add(`dataProvenance[${i}]`, 'INVALID_PROVENANCE', 'source and retrievedAt are required')
    })
  }
  // canal com contrato oficial inexistente é bloqueio explícito para publicação
  if (c.integration === 'available' && !(c.dataProvenance ?? []).some((p) => p.field === 'official_contract')) {
    v.add('integration', 'CONTRACT_EVIDENCE_REQUIRED', "integration 'available' exige provenance field 'official_contract'")
  }
  return v.result()
}

// ---------------------------------------------------------------------------
// AB-S5-003 — sinais de adequação
// ---------------------------------------------------------------------------

export type FitSignalInput = {
  channel: string
  audienceMatch: number   // 0..1 sobreposição com audiência da Persona
  formatMatch: number     // 0..1 compatibilidade de formatos
  visualMatch: number     // 0..1 coerência com direção visual
  cadenceFeasibility: number // 0..1 capacidade de cumprir cadência
  objectiveAlignment: number // 0..1 alinhamento com objetivo de negócio
  complianceRisk: number // 0..1 (maior = pior)
  productionCapacity: number // 0..1 capacidade de produção
}

export type FitScore = {
  channel: string
  score: number
  signals: FitSignalInput
  /** incertezas declaradas — recomendação explica dados faltantes */
  uncertainties: string[]
}

const WEIGHTS = { audienceMatch: 0.25, formatMatch: 0.2, visualMatch: 0.1, cadenceFeasibility: 0.15, objectiveAlignment: 0.15, complianceRisk: -0.05, productionCapacity: 0.1 }

export function scoreChannelFit(s: FitSignalInput): FitScore {
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
  const signals: FitSignalInput = { ...s, audienceMatch: clamp01(s.audienceMatch), formatMatch: clamp01(s.formatMatch), visualMatch: clamp01(s.visualMatch), cadenceFeasibility: clamp01(s.cadenceFeasibility), objectiveAlignment: clamp01(s.objectiveAlignment), complianceRisk: clamp01(s.complianceRisk), productionCapacity: clamp01(s.productionCapacity) }
  const raw = Object.entries(WEIGHTS).reduce((acc, [k, w]) => acc + w * (signals as unknown as Record<string, number>)[k], 0)
  const uncertainties: string[] = []
  for (const [k, val] of Object.entries(signals)) {
    if (val === 0.5) uncertainties.push(`${k}=0.5 assumido sem dado`) // 0.5 marcador de desconhecido
  }
  return { channel: s.channel, score: Math.round(Math.max(0, raw) * 1000) / 1000, signals, uncertainties }
}

// ---------------------------------------------------------------------------
// AB-S5-004 — hipóteses de canal
// ---------------------------------------------------------------------------

export type ChannelHypothesis = {
  hypothesisId: string
  channel: string
  score: number
  rank: number
  rationale: string[]
  uncertainties: string[]
  missingData: string[]
  createdAt: string
  status: 'proposed' | 'approved' | 'rejected'
}

export function generateChannelHypotheses(fits: FitScore[], meta: { createdBy: string }): ChannelHypothesis[] {
  const sorted = [...fits].sort((a, b) => b.score - a.score)
  const createdAt = nowIso()
  return sorted.map((f, i) => ({
    hypothesisId: `hyp-${computeContentHash({ channel: f.channel, createdAt }).slice(7, 15)}`,
    channel: f.channel,
    score: f.score,
    rank: i + 1,
    rationale: [
      `audiência ${f.signals.audienceMatch}`,
      `formato ${f.signals.formatMatch}`,
      `cadência ${f.signals.cadenceFeasibility}`,
      `objetivo ${f.signals.objectiveAlignment}`,
    ],
    uncertainties: [...f.uncertainties],
    missingData: f.uncertainties.map((u) => u.split('=')[0]),
    createdAt,
    status: 'proposed',
    // createdBy registrado no plano derivado, não na hipótese crua
    ...({} as Record<string, never>),
  }))
}

// ---------------------------------------------------------------------------
// AB-S5-005 — comparação de combinações
// ---------------------------------------------------------------------------

export type ChannelCombination = {
  channels: string[]
  potentialReach: number  // 0..1
  effort: number          // 0..1 (maior = mais esforço)
  reuse: number           // 0..1 reaproveitamento de conteúdo
  risk: number            // 0..1
  cost: number            // 0..1
  capacityFit: number     // 0..1
}

export type CombinationComparison = {
  combinationId: string
  channels: string[]
  compositeScore: number
  breakdown: ChannelCombination
  version: number
  createdAt: string
}

const COMPOSITE_WEIGHTS = { potentialReach: 0.3, effort: -0.15, reuse: 0.2, risk: -0.15, cost: -0.1, capacityFit: 0.15 }

export function compareCombinations(combos: ChannelCombination[]): CombinationComparison[] {
  const createdAt = nowIso()
  return combos.map((c) => {
    const composite = Object.entries(COMPOSITE_WEIGHTS).reduce((acc, [k, w]) => acc + w * (c as unknown as Record<string, number>)[k], 0)
    return {
      combinationId: `combo-${computeContentHash({ channels: c.channels, createdAt }).slice(7, 15)}`,
      channels: [...c.channels],
      compositeScore: Math.round(Math.max(0, composite) * 1000) / 1000,
      breakdown: c,
      version: 1,
      createdAt,
    }
  }).sort((a, b) => b.compositeScore - a.compositeScore)
}
