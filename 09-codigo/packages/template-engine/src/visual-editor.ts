/**
 * Editor visual controlado (AB-S3-006).
 * Composição por blocos aprovados do template: ordenar, escolher variantes, ajustar conteúdo, viewport.
 * Regras: blocos fora do template são rejeitados; variantes fora do catálogo são rejeitadas;
 * mudanças não publicam (produce draft de composição versionado); versão anterior pode ser restaurada;
 * configuração estrutural inválida falha com erros por campo.
 */
import { CANONICAL_BLOCK_ORDER, findTemplate, type BlockType } from './registry'
import { findComponent } from './components'

export const EDITOR_MODEL_VERSION = 1

export type EditorBlockState = {
  block: BlockType
  variant?: string
  hidden?: boolean
  content?: Record<string, unknown>
}

export type EditorComposition = {
  compositionId: string
  modelVersion: number
  templateId: string
  templateVersion: string
  blocks: EditorBlockState[]
  viewport: 'desktop' | 'mobile'
  savedAtVersion: number
  status: 'draft' | 'published'
}

export type EditorHistoryEntry = {
  version: number
  savedAt: string
  actor: string
  changeSummary: string
  composition: EditorComposition
}

export type EditorValidation = { ok: boolean; errors: { path: string; message: string }[] }

export function validateComposition(composition: EditorComposition): EditorValidation {
  const errors: { path: string; message: string }[] = []
  const template = findTemplate(composition.templateId, composition.templateVersion)
  if (!template) errors.push({ path: 'template', message: `template ${composition.templateId}@${composition.templateVersion} não registrado` })

  if (composition.modelVersion !== EDITOR_MODEL_VERSION) {
    errors.push({ path: 'modelVersion', message: `modelVersion deve ser ${EDITOR_MODEL_VERSION}` })
  }
  if (!Array.isArray(composition.blocks) || composition.blocks.length === 0) {
    errors.push({ path: 'blocks', message: 'composição precisa de ao menos um bloco' })
    return { ok: false, errors }
  }

  const seen = new Set<string>()
  composition.blocks.forEach((b, i) => {
    const path = `blocks[${i}]`
    if (!CANONICAL_BLOCK_ORDER.includes(b.block)) {
      errors.push({ path: `${path}.block`, message: `bloco "${b.block}" não é um bloco aprovado` })
      return
    }
    if (seen.has(b.block)) {
      errors.push({ path: `${path}.block`, message: `bloco "${b.block}" duplicado na composição` })
    }
    seen.add(b.block)

    if (template && !template.blocks.includes(b.block)) {
      errors.push({ path: `${path}.block`, message: `bloco "${b.block}" não pertence ao template ${template.templateId}@${template.version}` })
    }
    if (b.variant !== undefined) {
      const cat = findComponent(blockToComponent(b.block))
      if (!cat) {
        errors.push({ path: `${path}.variant`, message: `sem catálogo para o bloco "${b.block}"` })
      } else if (!cat.variants.some(v => v.id === b.variant)) {
        errors.push({ path: `${path}.variant`, message: `variante "${b.variant}" não registrada para ${b.block}` })
      }
    }
    if (b.content !== undefined && (typeof b.content !== 'object' || Array.isArray(b.content))) {
      errors.push({ path: `${path}.content`, message: 'content deve ser objeto' })
    }
  })

  if (composition.viewport !== 'desktop' && composition.viewport !== 'mobile') {
    errors.push({ path: 'viewport', message: 'viewport deve ser desktop|mobile' })
  }
  if (composition.status !== 'draft' && composition.status !== 'published') {
    errors.push({ path: 'status', message: 'status deve ser draft|published' })
  }
  if (!Number.isInteger(composition.savedAtVersion) || composition.savedAtVersion < 1) {
    errors.push({ path: 'savedAtVersion', message: 'savedAtVersion deve ser inteiro >= 1' })
  }
  return { ok: errors.length === 0, errors }
}

function blockToComponent(block: BlockType): string {
  const map: Partial<Record<BlockType, string>> = {
    hero: 'hero', 'article-grid': 'article-grid', 'featured-guide': 'featured-guide',
    comparison: 'comparison-table', 'product-recommendation': 'product-card',
    newsletter: 'newsletter', faq: 'faq', footer: 'footer',
  }
  return map[block] ?? block
}

export type EditorOperationResult = { ok: boolean; composition?: EditorComposition; error?: string }

/** Reordenar blocos: mantém apenas blocos válidos do template; ordem customizada permitida dentro do conjunto aprovado. */
export function reorderBlocks(composition: EditorComposition, newOrder: BlockType[]): EditorOperationResult {
  const template = findTemplate(composition.templateId, composition.templateVersion)
  if (!template) return { ok: false, error: 'template não registrado' }
  const valid = new Set(template.blocks)
  if (newOrder.length !== composition.blocks.length) return { ok: false, error: 'reordenação deve preservar a quantidade de blocos' }
  const current = new Set(composition.blocks.map(b => b.block))
  for (const b of newOrder) {
    if (!valid.has(b)) return { ok: false, error: `bloco "${b}" não pertence ao template` }
    if (!current.has(b)) return { ok: false, error: `bloco "${b}" não está na composição atual` }
  }
  const byBlock = new Map(composition.blocks.map(b => [b.block, b]))
  const blocks = newOrder.map(b => byBlock.get(b) as EditorBlockState)
  return { ok: true, composition: { ...composition, blocks } }
}

/** Trocar variante de um bloco; variante precisa existir no catálogo. */
export function setBlockVariant(composition: EditorComposition, block: BlockType, variant: string): EditorOperationResult {
  const cat = findComponent(blockToComponent(block))
  if (!cat) return { ok: false, error: `sem catálogo para o bloco "${block}"` }
  if (!cat.variants.some(v => v.id === variant)) return { ok: false, error: `variante "${variant}" não registrada` }
  const idx = composition.blocks.findIndex(b => b.block === block)
  if (idx < 0) return { ok: false, error: `bloco "${block}" não está na composição` }
  const blocks = composition.blocks.map((b, i) => (i === idx ? { ...b, variant } : b))
  return { ok: true, composition: { ...composition, blocks } }
}

/** Ajustar conteúdo de um bloco (payload livre porém validável pelo catálogo na renderização). */
export function setBlockContent(composition: EditorComposition, block: BlockType, content: Record<string, unknown>): EditorOperationResult {
  const idx = composition.blocks.findIndex(b => b.block === block)
  if (idx < 0) return { ok: false, error: `bloco "${block}" não está na composição` }
  const blocks = composition.blocks.map((b, i) => (i === idx ? { ...b, content } : b))
  return { ok: true, composition: { ...composition, blocks } }
}

/** Alternar viewport para preview responsivo. */
export function setViewport(composition: EditorComposition, viewport: 'desktop' | 'mobile'): EditorOperationResult {
  return { ok: true, composition: { ...composition, viewport } }
}

/** Histórico versionado: salvar cria nova versão draft; restaurar retorna cópia da versão anterior como nova versão draft. */
export function saveComposition(history: EditorHistoryEntry[], composition: EditorComposition, actor: string, changeSummary: string): { history: EditorHistoryEntry[]; version: number } {
  const validation = validateComposition(composition)
  if (!validation.ok) throw new Error(`composição inválida: ${validation.errors.map(e => `${e.path}: ${e.message}`).join('; ')}`)
  const version = (history.at(-1)?.version ?? 0) + 1
  const entry: EditorHistoryEntry = {
    version,
    savedAt: new Date(0).toISOString(), // determinístico: timestamp real é responsabilidade da camada de persistência (Agente A)
    actor,
    changeSummary,
    composition: { ...composition, savedAtVersion: version, status: 'draft' },
  }
  return { history: [...history, entry], version }
}

export function restoreVersion(history: EditorHistoryEntry[], targetVersion: number, actor: string): { history: EditorHistoryEntry[]; restored: EditorComposition } | null {
  const entry = history.find(h => h.version === targetVersion)
  if (!entry) return null
  const restored: EditorComposition = { ...entry.composition, status: 'draft' }
  const version = (history.at(-1)?.version ?? 0) + 1
  const newEntry: EditorHistoryEntry = {
    version,
    savedAt: new Date(0).toISOString(),
    actor,
    changeSummary: `restauração da versão ${targetVersion}`,
    composition: { ...restored, savedAtVersion: version },
  }
  return { history: [...history, newEntry], restored: { ...restored, savedAtVersion: version } }
}
