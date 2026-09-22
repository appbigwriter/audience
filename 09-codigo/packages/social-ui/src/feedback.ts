/**
 * Feedback de desempenho para recomendação (AB-S5-009).
 * Métricas verificadas podem alterar a recomendação futura SEM reescrever histórico;
 * aprendizado é separado de fato e hipótese.
 */
import type { RecommendationRun } from './recommendation'

export const FEEDBACK_MODEL_VERSION = 1

export type MetricProvenance = 'verified-readback' | 'reported' | 'estimated'

export type ChannelMetric = {
  channelId: string
  periodStart: string
  periodEnd: string
  metric: string
  value: number
  provenance: MetricProvenance
  readbackAt?: string
}

export type LearningEntry = {
  entryId: string
  kind: 'fact' | 'hypothesis'
  statement: string
  basis: { metricRefs: string[]; note: string }
  createdAt: string
}

export type FeedbackRun = {
  runId: string
  basedOnMetrics: ChannelMetric[]
  learnings: LearningEntry[]
  recommendationAdjustments: { channelId: string; adjustment: string; reason: string }[]
  historyPreserved: boolean
}

/** Só métricas com provenance verificada alimentam aprendizado; reportadas/estimadas ficam de fora. */
export function ingestVerifiedMetrics(metrics: ChannelMetric[]): { accepted: ChannelMetric[]; rejected: ChannelMetric[] } {
  const accepted = metrics.filter(m => m.provenance === 'verified-readback')
  const rejected = metrics.filter(m => m.provenance !== 'verified-readback')
  return { accepted, rejected }
}

/** Ajuste de recomendação futura: gera hipóteses novas sem mutar runs anteriores (histórico imutável). */
export function applyFeedbackToRecommendation(
  baseline: RecommendationRun,
  metrics: ChannelMetric[],
  opts?: { runId?: string },
): FeedbackRun {
  const { accepted } = ingestVerifiedMetrics(metrics)
  const learnings: LearningEntry[] = []
  const adjustments: FeedbackRun['recommendationAdjustments'] = []

  const byChannel = new Map<string, ChannelMetric[]>()
  for (const m of accepted) {
    const list = byChannel.get(m.channelId) ?? []
    list.push(m)
    byChannel.set(m.channelId, list)
  }

  let i = 0
  for (const [channelId, list] of byChannel) {
    const engagement = list.find(m => /engage|saves|shares/i.test(m.metric))
    if (engagement && engagement.value > 0) {
      learnings.push({
        entryId: `learn-${++i}`,
        kind: 'fact',
        statement: `canal ${channelId} registrou ${engagement.metric}=${engagement.value} em ${engagement.periodStart}..${engagement.periodEnd} (readback verificado)`,
        basis: { metricRefs: [`${channelId}:${engagement.metric}:${engagement.periodEnd}`], note: 'fato operacional derivado de métrica verificada' },
        createdAt: new Date(0).toISOString(),
      })
    }
    const baselineCandidate = baseline.candidates.find(c => c.channelId === channelId)
    if (baselineCandidate && engagement && engagement.value > 1000) {
      adjustments.push({
        channelId,
        adjustment: 'increase-priority',
        reason: `engajamento verificado (${engagement.value}) acima do limiar; hipótese de priorização para próximas runs`,
      })
    } else if (baselineCandidate && engagement && engagement.value < 50) {
      adjustments.push({
        channelId,
        adjustment: 'decrease-priority',
        reason: `engajamento verificado (${engagement.value}) abaixo do limiar; hipótese de redução para próximas runs`,
      })
    }
  }

  for (const adj of adjustments) {
    learnings.push({
      entryId: `learn-${++i}`,
      kind: 'hypothesis',
      statement: `${adj.channelId} deve ter prioridade ${adj.adjustment === 'increase-priority' ? 'aumentada' : 'reduzida'} em recomendações futuras`,
      basis: { metricRefs: [], note: adj.reason },
      createdAt: new Date(0).toISOString(),
    })
  }

  return {
    runId: opts?.runId ?? `feedback-${baseline.modelVersion}-${accepted.length}`,
    basedOnMetrics: accepted,
    learnings,
    recommendationAdjustments: adjustments,
    historyPreserved: true, // baseline permanece inalterado; ajustes são entradas novas
  }
}
