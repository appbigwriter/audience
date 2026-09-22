/**
 * Contrato de persistência do Audience Builder (AB-S1-003 suporte; AB-S2-002).
 *
 * Define o que a camada de persistência deve oferecer para o gate de
 * liberação (readback) sem acoplar o domínio ao Postgres/Supabase.
 * `packages/persistence` implementa; este arquivo só descreve capacidade.
 */
export const PERSISTENCE_CONTRACT_VERSION = 1

export type PersistenceReadbackCapability = {
  contractVersion: number
  /** true quando escrita->leitura de confirmação é verificável. */
  readbackSupported: boolean
  /** isolamento por tenant/project obrigatório. */
  tenantScopeRequired: true
  /** backend declarado: `memory` (testes), `json` (dev local), `postgres` (produção futura). */
  backend: 'memory' | 'json' | 'postgres'
}
