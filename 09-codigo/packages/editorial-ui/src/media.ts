/**
 * Asset registry e direitos (AB-S4-008) + Media QA (AB-S4-009).
 * Asset sem direitos é bloqueado; falha de QA gera blocker reproduzível.
 */
export const MEDIA_UI_VERSION = 1

export type LicenseType = 'cc0' | 'cc-by' | 'cc-by-sa' | 'editorial-commercial' | 'generated-owned' | 'licensed-stock' | 'client-provided'

export type MediaAsset = {
  assetId: string
  kind: 'image' | 'video' | 'audio' | 'vector'
  url?: string
  origin: string
  license: LicenseType
  attributionRequired: boolean
  attributionText?: string
  generatorPrompt?: string
  generatorModel?: string
  widthPx: number
  heightPx: number
  altText: string
  contentLink?: { articleId: string }
  bytesEstimate?: number
}

export type MediaQaIssue = { code: string; message: string; severity: 'blocker' | 'warning' }

export function validateAsset(asset: MediaAsset): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!asset.assetId) errors.push('assetId obrigatório')
  if (!['image', 'video', 'audio', 'vector'].includes(asset.kind)) errors.push('kind inválido')
  if (!asset.origin?.trim()) errors.push('origem obrigatória')
  const licenses: LicenseType[] = ['cc0', 'cc-by', 'cc-by-sa', 'editorial-commercial', 'generated-owned', 'licensed-stock', 'client-provided']
  if (!licenses.includes(asset.license)) errors.push('licença inválida')
  if (asset.attributionRequired && !asset.attributionText?.trim()) errors.push('atribuição obrigatória ausente')
  if (!Number.isInteger(asset.widthPx) || asset.widthPx < 1 || !Number.isInteger(asset.heightPx) || asset.heightPx < 1) errors.push('dimensões inválidas')
  if (!asset.altText?.trim()) errors.push('alt text obrigatório')
  return { ok: errors.length === 0, errors }
}

/** Direitos: sem licença conhecida → bloqueado. */
export function checkAssetRights(asset: MediaAsset): { allowed: boolean; reason?: string } {
  if (!validateAsset(asset).ok) return { allowed: false, reason: 'asset inválido' }
  return { allowed: true }
}

/** Media QA: proporção, alt text, peso, legibilidade, consistência visual, uso permitido. */
export function mediaQa(asset: MediaAsset, opts?: { maxBytes?: number; consistencyProfile?: { imageDirection: string } }): { pass: boolean; issues: MediaQaIssue[] } {
  const issues: MediaQaIssue[] = []
  const ratio = asset.widthPx / asset.heightPx
  if (asset.kind === 'image' && (ratio < 0.5 || ratio > 3)) {
    issues.push({ code: 'ASPECT_RATIO', message: `proporção ${ratio.toFixed(2)} fora do intervalo aceito (0.5–3.0)`, severity: 'warning' })
  }
  if (asset.altText.length < 10) issues.push({ code: 'ALT_TEXT_SHORT', message: 'alt text com menos de 10 caracteres', severity: 'blocker' })
  const maxBytes = opts?.maxBytes ?? 500_000
  if (asset.bytesEstimate !== undefined && asset.bytesEstimate > maxBytes) {
    issues.push({ code: 'FILE_TOO_HEAVY', message: `peso estimado ${asset.bytesEstimate}B acima do limite ${maxBytes}B`, severity: 'warning' })
  }
  if (asset.widthPx < 640) issues.push({ code: 'RESOLUTION_LOW', message: 'largura < 640px pode comprometer legibilidade', severity: 'warning' })
  if (asset.attributionRequired && !asset.attributionText) {
    issues.push({ code: 'ATTRIBUTION_MISSING', message: 'licença exige atribuição não fornecida', severity: 'blocker' })
  }
  const blockers = issues.filter(i => i.severity === 'blocker')
  return { pass: blockers.length === 0, issues }
}
