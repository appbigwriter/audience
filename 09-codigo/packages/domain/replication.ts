/**
 * SPRINT S9 (backend) — Blueprint de criação repetível + relatório de portfólio.
 *
 * AB-S9-001 blueprint com entradas, validações, jobs, handoffs, Gates, outputs, rollback;
 * AB-S9-002 provisionamento repetível por manifesto (sem copiar código), idempotente e isolado;
 * AB-S9-005 relatório de portfólio separando ativos/bloqueados/piloto/staging/produção.
 */
import { AudienceBuilderContractError, nowIso } from '../contracts/common'
import type { AudienceProjectManifesto } from './manifesto'
import { validateManifesto } from './manifesto'

// ---------------------------------------------------------------------------
// AB-S9-001 — blueprint
// ---------------------------------------------------------------------------

export const BLUEPRINT_VERSION = 1

export type BlueprintStep = {
  stepId: string
  name: string
  /** validações que precisam passar antes do passo */
  validations: string[]
  jobKind: 'intake' | 'persona_binding' | 'manifesto' | 'template' | 'editorial' | 'social' | 'provisioning'
  gate: string | null
  outputs: string[]
  rollback: string | null
}

export type AudienceProjectBlueprint = {
  blueprintId: string
  version: number
  description: string
  inputs: string[]
  steps: BlueprintStep[]
  handoffs: string[]
  finalGates: string[]
}

export function getDefaultBlueprint(): AudienceProjectBlueprint {
  return {
    blueprintId: 'ab-blueprint-default',
    version: BLUEPRINT_VERSION,
    description: 'Criação de Audience Project a partir de Persona aprovada, com jobs rastreáveis e Gates',
    inputs: [
      'PersonaIntakePackage (approved, versionado, hash)',
      'CreateAudienceProjectInput (owner/tenant/nicho/objetivo)',
      'Manifesto válido',
    ],
    steps: [
      { stepId: 's1', name: 'intake', validations: ['persona_approved', 'package_valid_versioned', 'persistence_readback_available'], jobKind: 'intake', gate: null, outputs: ['projeto draft criado'], rollback: 'arquivar projeto' },
      { stepId: 's2', name: 'persona_binding', validations: ['hash_integro', 'versão_coberta_por_aprovação'], jobKind: 'persona_binding', gate: null, outputs: ['binding imutável'], rollback: 'remover binding (novo binding exige nova aprovação)' },
      { stepId: 's3', name: 'niches_import', validations: ['limitações_presentes'], jobKind: 'intake', gate: null, outputs: ['nichos under_analysis'], rollback: 'descartar nichos' },
      { stepId: 's4', name: 'manifesto', validations: ['manifesto_válido', 'binding_ativo'], jobKind: 'manifesto', gate: null, outputs: ['manifesto versionado', 'pacote de configuração'], rollback: 'nova versão do manifesto' },
      { stepId: 's5', name: 'provisioning', validations: ['pacote_válido'], jobKind: 'provisioning', gate: 'G-deploy (Sergio)', outputs: ['projeto CT com readback'], rollback: 'readback pendente até Gate' },
      { stepId: 's6', name: 'editorial', validations: ['perfil_derivado', 'fontes_registradas'], jobKind: 'editorial', gate: null, outputs: ['drafts'], rollback: 'nova versão do draft' },
      { stepId: 's7', name: 'social_discovery', validations: ['capability_map_validado'], jobKind: 'social', gate: 'G-social (Sergio) para contas', outputs: ['hipóteses de canal'], rollback: 'hipóteses são reversíveis' },
    ],
    handoffs: ['handoff manifesto→template', 'handoff pacote→blog', 'handoff hipóteses→social engine'],
    finalGates: ['G-publicação (Sergio)', 'G-gasto (Sergio)'],
  }
}

// ---------------------------------------------------------------------------
// AB-S9-002 — provisionamento repetível
// ---------------------------------------------------------------------------

export type ReplicationOutcome =
  | { outcome: 'created'; projectId: string }
  | { outcome: 'duplicate'; existingProjectId: string }
  | { outcome: 'invalid_manifesto'; errors: Array<{ field: string; code: string }> }
  | { outcome: 'blocked'; reason: string }

/**
 * Segundo projeto é criado POR MANIFESTO — mesmo código, zero cópia.
 * Idempotência: mesmo slug/owner no tenant retorna duplicate.
 * Isolamento: tenant diferente cria projeto independente.
 */
export function replicateFromManifesto(
  manifests: { manifesto: AudienceProjectManifesto },
  existing: Array<{ id: string; tenantId: string; ownerId: string; slug: string }>,
  ctx: { tenantId: string; ownerId: string; idFactory: () => string },
): ReplicationOutcome {
  const validation = validateManifesto(manifests.manifesto)
  if (!validation.ok) return { outcome: 'invalid_manifesto', errors: validation.errors.map((e) => ({ field: e.field, code: e.code })) }
  const m = manifests.manifesto
  const dup = existing.find((p) => p.tenantId === ctx.tenantId && p.ownerId === ctx.ownerId && p.slug === m.project.slug)
  if (dup) return { outcome: 'duplicate', existingProjectId: dup.id }
  return { outcome: 'created', projectId: ctx.idFactory() }
}

// ---------------------------------------------------------------------------
// AB-S9-005 — relatório de portfólio
// ---------------------------------------------------------------------------

export type PortfolioProjectView = {
  projectId: string
  slug: string
  tenantId: string
  status: string
  category: 'pilot' | 'active' | 'blocked' | 'staging' | 'production_verified'
  lastTransitionAt: string | null
  blockers: string[]
}

export type PortfolioReport = {
  generatedAt: string
  total: number
  byCategory: Record<string, number>
  projects: PortfolioProjectView[]
}

/**
 * Classificação honesta: `production_verified` SOMENTE quando há readback
 * verificado de produção — caso contrário permanece pilot/staging.
 */
export function buildPortfolioReport(
  projects: Array<{
    id: string; slug: string; tenantId: string; status: string
    transitions: Array<{ at: string; to: string }>; blockers?: string[]
    productionReadbackVerified?: boolean; isPilot?: boolean
  }>,
): PortfolioReport {
  const generatedAt = nowIso()
  const views: PortfolioProjectView[] = projects.map((p) => {
    let category: PortfolioProjectView['category']
    if (p.productionReadbackVerified === true) category = 'production_verified'
    else if (p.isPilot === true) category = 'pilot'
    else if (p.status === 'blocked') category = 'blocked'
    else if (p.status === 'active') category = 'active'
    else category = 'staging'
    const lastTransition = p.transitions.length ? p.transitions[p.transitions.length - 1] : null
    return { projectId: p.id, slug: p.slug, tenantId: p.tenantId, status: p.status, category, lastTransitionAt: lastTransition?.at ?? null, blockers: p.blockers ?? [] }
  })
  const byCategory = views.reduce<Record<string, number>>((acc, v) => { acc[v.category] = (acc[v.category] ?? 0) + 1; return acc }, {})
  return { generatedAt, total: views.length, byCategory, projects: views }
}

/** Guard: produção sem readback deve lançar em código futuro — helper de asserção. */
export function assertNoProductionWithoutReadback(view: PortfolioProjectView): void {
  if (view.category === 'production_verified' && view.lastTransitionAt === null) {
    throw new AudienceBuilderContractError('PRODUCTION_WITHOUT_READBACK', 'production_verified requires evidence', 422)
  }
}
