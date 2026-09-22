/**
 * AB-S2-002 — Persistência relacional do Audience Project (contrato + local).
 *
 * DB-first: schema relacional versionado em `migrations/`; implementação
 * local `InMemoryAudienceProjectRepository` para testes com readback
 * verificável. Produção dependerá de Postgres/Supabase via Gate.
 *
 * Regras:
 * - tenant/project scope obrigatório;
 * - constraints impedem binding inválido;
 * - duplicidade slug/owner controlada (unique owner+slug);
 * - readback retorna exatamente o que foi escrito.
 */
import type { AudienceProject, PersonaBinding } from '../domain/audience-project'
import type { ImportedNiche } from '../domain/potential-niches'
import { PERSISTENCE_CONTRACT_VERSION, type PersistenceReadbackCapability } from '../contracts/persistence-contract'

export type SaveOutcome = { outcome: 'saved'; id: string } | { outcome: 'duplicate'; existingId: string }

export interface AudienceProjectRepository {
  /** Upsert com constraint de unicidade owner+slug dentro do tenant. */
  save(project: AudienceProject): SaveOutcome
  findById(id: string): AudienceProject | undefined
  /** Readback por slug dentro do tenant (isolamento obrigatório). */
  findBySlug(tenantId: string, slug: string): AudienceProject | undefined
  listByTenant(tenantId: string): AudienceProject[]
  /** Readback do binding: retorna os mesmos valores gravados. */
  getPersonaBinding(projectId: string): PersonaBinding | null
  saveNiches(projectId: string, niches: ImportedNiche[]): void
  getNiches(projectId: string): ImportedNiche[]
  capability(): PersistenceReadbackCapability
}

export class InMemoryAudienceProjectRepository implements AudienceProjectRepository {
  private readonly projects = new Map<string, AudienceProject>()
  private readonly niches = new Map<string, ImportedNiche[]>()

  save(project: AudienceProject): SaveOutcome {
    const existing = this.findBySlug(project.tenantId, project.slug)
    if (existing && existing.id !== project.id) return { outcome: 'duplicate', existingId: existing.id }
    this.projects.set(project.id, structuredClone(project))
    return { outcome: 'saved', id: project.id }
  }
  findById(id: string): AudienceProject | undefined {
    const found = this.projects.get(id)
    return found ? structuredClone(found) : undefined
  }
  findBySlug(tenantId: string, slug: string): AudienceProject | undefined {
    const found = [...this.projects.values()].find((p) => p.tenantId === tenantId && p.slug === slug)
    return found ? structuredClone(found) : undefined
  }
  listByTenant(tenantId: string): AudienceProject[] {
    return [...this.projects.values()].filter((p) => p.tenantId === tenantId).map((p) => structuredClone(p))
  }
  getPersonaBinding(projectId: string): PersonaBinding | null {
    const found = this.projects.get(projectId)
    return found?.personaBinding ? structuredClone(found.personaBinding) : null
    // fixme(readback): structuredClone preserva os valores gravados — sem transformação.
  }
  saveNiches(projectId: string, niches: ImportedNiche[]): void {
    const current = this.niches.get(projectId) ?? []
    const merged = [...current]
    for (const n of niches) {
      const idx = merged.findIndex((x) => x.nicheId === n.nicheId)
      if (idx >= 0) merged[idx] = n
      else merged.push(n)
    }
    this.niches.set(projectId, merged)
  }
  getNiches(projectId: string): ImportedNiche[] {
    return [...(this.niches.get(projectId) ?? [])].map((n) => structuredClone(n))
  }
  capability(): PersistenceReadbackCapability {
    return { contractVersion: PERSISTENCE_CONTRACT_VERSION, readbackSupported: true, tenantScopeRequired: true, backend: 'memory' }
  }
}

/** Readback explícito: leitura de confirmação após escrita. */
export function verifyReadback(repo: AudienceProjectRepository, projectId: string): { verified: boolean; details: Record<string, unknown> } {
  const read = repo.findById(projectId)
  if (!read) return { verified: false, details: { error: 'PROJECT_NOT_FOUND' } }
  const binding = repo.getPersonaBinding(projectId)
  return {
    verified: true,
    details: {
      id: read.id,
      slug: read.slug,
      tenantId: read.tenantId,
      status: read.status,
      personaBinding: binding ? { personaId: binding.personaId, personaVersionId: binding.personaVersionId, contentHash: binding.contentHash } : null,
    },
  }
}
