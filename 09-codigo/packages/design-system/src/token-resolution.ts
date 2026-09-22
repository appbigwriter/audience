/**
 * Resolução de tokens por Persona e nicho (AB-S3-002).
 * Herança explícita: template base → preset de nicho → orientação visual da Persona (Visual Consistency Profile)
 * → overrides aprovados do projeto. Overrides fora da allowlist são rejeitados; conflito de herança gera warning;
 * divergência da Persona gera bloqueio (a Bible da Persona nunca é alterada aqui).
 */
import { validateThemeManifest, type ContrastPair, type ThemeManifest, type ThemeTokens, type ValidationIssue } from './theme-manifest'
import { findNichePreset } from './presets'

export const TOKEN_OVERRIDE_ALLOWLIST = [
  'colors.primary', 'colors.primaryText', 'colors.focusRing', 'colors.surfaceAlt',
  'typography.fontFamily', 'typography.fontFamilyHeading', 'typography.baseSizePx', 'typography.scaleRatio',
  'spacing.unitPx', 'spacing.sectionY', 'spacing.gutter',
  'grid.containerMaxWidthPx', 'grid.readingWidthCh',
  'density', 'motion', 'imageDirection',
] as const
export type OverridableToken = (typeof TOKEN_OVERRIDE_ALLOWLIST)[number]

export type PersonaVisualProfile = {
  personaId: string
  personaVersionId: string
  contentHash: string
  visualDirection?: string
  preferredColors?: string[]
  imageDirection?: string
  density?: 'compact' | 'comfortable' | 'spacious'
  motion?: 'none' | 'subtle' | 'rich'
}

export type ResolveInput = {
  themeId: string
  templateBaseTokens: ThemeTokens
  nichePresetId?: string
  persona?: PersonaVisualProfile | null
  overrides?: Record<string, unknown>
  contrastPairs?: ContrastPair[]
}

export type ResolveResult = {
  manifest: ThemeManifest
  validation: ReturnType<typeof validateThemeManifest>
  originChain: string[]
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), obj)
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cur: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}
    cur = cur[k] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
}

const HEX = /^#[0-9a-fA-F]{6}$/

/** Resolve tokens combinando as camadas na ordem fixa; retorna manifest + validação. */
export function resolveThemeTokens(input: ResolveInput): ResolveResult {
  const originChain: string[] = ['template-base']
  const warnings: ValidationIssue[] = []
  let tokens: ThemeTokens = JSON.parse(JSON.stringify(input.templateBaseTokens)) as ThemeTokens
  let imageDirection: string | undefined
  const appliedOverrides: string[] = []

  if (input.nichePresetId) {
    const preset = findNichePreset(input.nichePresetId)
    if (!preset) {
      return {
        manifest: invalidManifest(input.themeId),
        validation: {
          ok: false,
          errors: [{ path: 'nichePresetId', code: 'PRESET_NOT_FOUND', message: `preset ${input.nichePresetId} não existe` }],
          warnings,
        },
        originChain,
      }
    }
    tokens = { ...tokens, ...preset.tokens, colors: { ...tokens.colors, ...preset.tokens.colors }, typography: { ...tokens.typography, ...preset.tokens.typography }, spacing: { ...tokens.spacing, ...preset.tokens.spacing }, grid: { ...tokens.grid, ...preset.tokens.grid } }
    if (preset.imageDirection) imageDirection = preset.imageDirection
    originChain.push(`niche-preset:${preset.id}@${preset.version}`)
  }

  if (input.persona) {
    const p = input.persona
    if (p.imageDirection && p.imageDirection !== imageDirection) {
      warnings.push({ path: 'persona.imageDirection', code: 'DIRECTION_CONFLICT', message: `Persona pede "${p.imageDirection}", nicho fornece "${imageDirection ?? 'nenhum'}"` })
    }
    if (p.density) tokens.density = p.density
    if (p.motion) tokens.motion = p.motion
    if (p.imageDirection) imageDirection = p.imageDirection
    if (p.preferredColors?.length) {
      const primary = p.preferredColors.find(c => HEX.test(c))
      if (primary && primary.toLowerCase() !== tokens.colors.primary.toLowerCase()) {
        tokens.colors.primary = primary
        tokens.colors.focusRing = primary
        appliedOverrides.push('persona.preferredColors[0]')
      } else if (primary) {
        appliedOverrides.push('persona.preferredColors[0]:no-op')
      }
    }
    originChain.push(`persona:${p.personaId}@${p.personaVersionId}`)
  }

  if (input.overrides) {
    for (const [key, value] of Object.entries(input.overrides)) {
      if (!(TOKEN_OVERRIDE_ALLOWLIST as readonly string[]).includes(key)) {
        return {
          manifest: invalidManifest(input.themeId),
          validation: {
            ok: false,
            errors: [{ path: `overrides.${key}`, code: 'OVERRIDE_NOT_ALLOWED', message: `override "${key}" fora da allowlist` }],
            warnings,
          },
          originChain,
        }
      }
      if (key === 'imageDirection') {
        imageDirection = String(value)
        appliedOverrides.push(key)
        continue
      }
      setPath(tokens as unknown as Record<string, unknown>, key, value)
      appliedOverrides.push(key)
    }
    originChain.push('overrides:approved')
  }

  const manifest: ThemeManifest = {
    schemaVersion: 1,
    themeId: input.themeId,
    version: 1,
    origin: {
      nichePresetId: input.nichePresetId,
      personaVisualProfileHash: input.persona?.contentHash,
      overrides: appliedOverrides,
    },
    tokens,
    contrastPairs: input.contrastPairs ?? [],
    imageDirection,
  }
  const validation = validateThemeManifest(manifest)
  validation.warnings.push(...warnings)
  return { manifest, validation, originChain }
}

function invalidManifest(themeId: string): ThemeManifest {
  return {
    schemaVersion: 1, themeId: themeId || 'ab-theme-invalid', version: 1,
    origin: { overrides: [] },
    tokens: { colors: {} as never, typography: {} as never, spacing: {} as never, grid: {} as never, density: 'comfortable', motion: 'subtle', accessibility: 'AA' },
    contrastPairs: [],
  }
}
