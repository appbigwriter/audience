/**
 * AB-S2-004 — Importar nichos potenciais.
 *
 * Recebe do Authority oportunidades/nichos SEM transformá-las em decisão:
 * - nichos possuem origem, data, confiança e limitações (do contrato);
 * - classificação: candidato / descartado / em_analise;
 * - o sistema não escolhe nicho final sem regra/decisão registrada;
 * - hipóteses são separadas de fatos (`kind: 'hypothesis'`).
 */
import type { PotentialNiche } from '../contracts/persona-intake'

export type NicheClassification = 'candidate' | 'discarded' | 'under_analysis'

export type ImportedNiche = {
  nicheId: string
  label: string
  origin: string
  observedAt: string
  confidence: number
  evidence: string[]
  limitations: string[]
  signals: string[]
  classification: NicheClassification
  classifiedAt: string
  classifiedBy: string
  /** sempre hypothesis no import; nicho final é decisão humana registrada. */
  kind: 'hypothesis'
}

export type NicheImportResult = {
  imported: ImportedNiche[]
  skipped: Array<{ nicheId: string; reason: string }>
}

/** Importação neutral: tudo entra como `under_analysis` + hypothesis. */
export function importPotentialNiches(
  niches: PotentialNiche[],
  meta: { importedAt: string; importedBy: string },
): NicheImportResult {
  const imported: ImportedNiche[] = []
  const skipped: Array<{ nicheId: string; reason: string }> = []
  for (const n of niches) {
    if (!n?.nicheId) {
      skipped.push({ nicheId: String(n?.nicheId ?? ''), reason: 'MISSING_NICHE_ID' })
      continue
    }
    if (typeof n.confidence !== 'number' || n.confidence < 0 || n.confidence > 1) {
      skipped.push({ nicheId: n.nicheId, reason: 'INVALID_CONFIDENCE' })
      continue
    }
    if (!Array.isArray(n.limitations) || n.limitations.length === 0) {
      skipped.push({ nicheId: n.nicheId, reason: 'MISSING_LIMITATIONS' })
      continue
    }
    imported.push({
      nicheId: n.nicheId,
      label: n.label,
      origin: n.origin,
      observedAt: n.observedAt,
      confidence: n.confidence,
      evidence: [...n.evidence],
      limitations: [...n.limitations],
      signals: [...(n.signals ?? [])],
      classification: 'under_analysis',
      classifiedAt: meta.importedAt,
      classifiedBy: meta.importedBy,
      kind: 'hypothesis',
    })
  }
  return { imported, skipped }
}

/** Reclassificação é ação explícita com ator — nunca automática. */
export function reclassifyNiche(niche: ImportedNiche, classification: NicheClassification, by: string, at: string): ImportedNiche {
  if (!by) throw new Error('reclassifyNiche requires actor')
  return { ...niche, classification, classifiedBy: by, classifiedAt: at }
}

/**
 * Regra de seleção explícita: sistema só PRÓPOR um nicho candidato com
 * maior confiança; a decisão final é humana (`decidedBy` obrigatório).
 */
export function proposeTopCandidate(niches: ImportedNiche[], rule: 'highest_confidence'): { proposal: ImportedNiche | null; rule: string; decidedBy: null } {
  if (rule !== 'highest_confidence') throw new Error('unsupported rule')
  const sorted = [...niches].sort((a, b) => b.confidence - a.confidence)
  return { proposal: sorted[0] ?? null, rule, decidedBy: null }
}
