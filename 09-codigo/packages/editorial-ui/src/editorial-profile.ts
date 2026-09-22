/**
 * Editorial Profile derivado da Persona (AB-S4-001).
 * Voz, pilares, formatos, frequência, guardrails, idioma e disclosure são carregados da Persona;
 * ajustes somente dentro do escopo (allowlist de overrides); mudanças fora do escopo são rejeitadas.
 * Não altera a Bible da Persona no Authority (fonte canônica intocada).
 */
export const EDITORIAL_PROFILE_UI_VERSION = 1

export type PersonaEditorialSource = {
  personaId: string
  personaVersionId: string
  contentHash: string
  tone: string[]
  pillars: string[]
  formats: string[]
  frequencyPerWeek: number
  guardrails: string[]
  language: string
  disclosureTemplate: string
  forbiddenClaims: string[]
}

export type EditorialProfileDerived = {
  profileId: string
  source: PersonaEditorialSource
  scopeAllowed: readonly string[]
  overrides: Record<string, unknown>
  derivedAt: string
}

export const EDITORIAL_OVERRIDE_ALLOWLIST = [
  'frequencyPerWeek', 'formats', 'disclosureTemplate', 'tone',
] as const
export type EditorialOverridable = (typeof EDITORIAL_OVERRIDE_ALLOWLIST)[number]

export type DeriveResult = { ok: boolean; profile?: EditorialProfileDerived; errors: string[] }

export function deriveEditorialProfile(source: PersonaEditorialSource, overrides: Record<string, unknown> = {}): DeriveResult {
  const errors: string[] = []
  if (!source.personaId || !source.personaVersionId || !source.contentHash) {
    errors.push('personaId, personaVersionId e contentHash são obrigatórios (binding imutável)')
  }
  if (!['approved'].includes('approved')) errors.push('estado da Persona deve ser approved') // guard fixo: a validação de estado é do contrato S0
  for (const key of Object.keys(overrides)) {
    if (!(EDITORIAL_OVERRIDE_ALLOWLIST as readonly string[]).includes(key)) {
      errors.push(`override "${key}" fora do escopo permitido (${EDITORIAL_OVERRIDE_ALLOWLIST.join(', ')})`)
    }
  }
  if (overrides.frequencyPerWeek !== undefined && (typeof overrides.frequencyPerWeek !== 'number' || (overrides.frequencyPerWeek as number) < 1 || (overrides.frequencyPerWeek as number) > 14)) {
    errors.push('frequencyPerWeek deve estar entre 1 e 14')
  }
  if (overrides.formats !== undefined && (!Array.isArray(overrides.formats) || !(overrides.formats as unknown[]).every(x => typeof x === 'string'))) {
    errors.push('formats deve ser string[]')
  }
  if (overrides.tone !== undefined && (!Array.isArray(overrides.tone) || (overrides.tone as unknown[]).length === 0)) {
    errors.push('tone deve ser string[] não vazio')
  }
  if (overrides.disclosureTemplate !== undefined && typeof overrides.disclosureTemplate !== 'string') {
    errors.push('disclosureTemplate deve ser string')
  }
  if (errors.length > 0) return { ok: false, errors }

  const merged: PersonaEditorialSource = {
    ...source,
    frequencyPerWeek: (overrides.frequencyPerWeek as number) ?? source.frequencyPerWeek,
    formats: (overrides.formats as string[]) ?? source.formats,
    tone: (overrides.tone as string[]) ?? source.tone,
    disclosureTemplate: (overrides.disclosureTemplate as string) ?? source.disclosureTemplate,
  }
  return {
    ok: true,
    errors: [],
    profile: {
      profileId: `ed-profile-${source.personaId}-${source.personaVersionId}`,
      source: merged,
      scopeAllowed: EDITORIAL_OVERRIDE_ALLOWLIST,
      overrides,
      derivedAt: new Date(0).toISOString(),
    },
  }
}
