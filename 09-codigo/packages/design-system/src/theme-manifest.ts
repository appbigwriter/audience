/**
 * Theme Manifest — modelo versionado de tokens visuais por projeto/template (AB-S3-001).
 * Tokens cobrem cor, tipografia, espaçamento, grid, densidade, motion e acessibilidade.
 * O schema recusa configuração inválida quando detectável (hex, ranges, enums, contraste).
 */
import { contrastRatio, isHexColor, meetsAA, meetsAAA } from './contrast'

export const THEME_MANIFEST_SCHEMA_VERSION = 1

export type DensityLevel = 'compact' | 'comfortable' | 'spacious'
export type MotionLevel = 'none' | 'subtle' | 'rich'
export type AccessibilityLevel = 'AA' | 'AAA'

export type ColorTokens = {
  background: string
  surface: string
  surfaceAlt: string
  text: string
  textMuted: string
  primary: string
  primaryText: string
  border: string
  focusRing: string
}

export type TypographyTokens = {
  fontFamily: string
  fontFamilyHeading: string
  baseSizePx: number
  scaleRatio: number
  lineHeightBody: number
  lineHeightHeading: number
}

export type SpacingTokens = {
  unitPx: number
  sectionY: number
  gutter: number
}

export type GridTokens = {
  containerMaxWidthPx: number
  columns: number
  readingWidthCh: number
}

export type ThemeTokens = {
  colors: ColorTokens
  typography: TypographyTokens
  spacing: SpacingTokens
  grid: GridTokens
  density: DensityLevel
  motion: MotionLevel
  accessibility: AccessibilityLevel
}

export type ContrastPair = {
  name: string
  fg: keyof ColorTokens
  bg: keyof ColorTokens
  largeText?: boolean
}

export type ThemeOrigin = {
  templateId?: string
  templateVersion?: string
  nichePresetId?: string
  personaVisualProfileHash?: string
  overrides: string[]
}

export type ThemeManifest = {
  schemaVersion: number
  themeId: string
  version: number
  origin: ThemeOrigin
  tokens: ThemeTokens
  contrastPairs: ContrastPair[]
  imageDirection?: string
  notes?: string
}

export type ValidationIssue = { path: string; code: string; message: string }
export type ValidationResult = { ok: boolean; errors: ValidationIssue[]; warnings: ValidationIssue[] }

export const COLOR_KEYS: (keyof ColorTokens)[] = [
  'background', 'surface', 'surfaceAlt', 'text', 'textMuted', 'primary', 'primaryText', 'border', 'focusRing',
]

/** Pares de contraste exigidos por padrão — texto sobre superfícies e ação primária. */
export const DEFAULT_CONTRAST_PAIRS: ContrastPair[] = [
  { name: 'text/background', fg: 'text', bg: 'background' },
  { name: 'text/surface', fg: 'text', bg: 'surface' },
  { name: 'text/surfaceAlt', fg: 'text', bg: 'surfaceAlt' },
  { name: 'textMuted/background', fg: 'textMuted', bg: 'background' },
  { name: 'textMuted/surface', fg: 'textMuted', bg: 'surface' },
  { name: 'primary/background', fg: 'primary', bg: 'background' },
  { name: 'primaryText/primary', fg: 'primaryText', bg: 'primary' },
]

const THEME_ID_RE = /^ab-theme-[a-z0-9]+(-[a-z0-9]+)*$/

function err(path: string, code: string, message: string): ValidationIssue {
  return { path, code, message }
}

function checkNumber(
  issues: ValidationIssue[], path: string, value: unknown, min: number, max: number,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(err(path, 'NUMBER_REQUIRED', `${path} deve ser número finito`))
    return
  }
  if (value < min || value > max) {
    issues.push(err(path, 'RANGE', `${path}=${value} fora do intervalo [${min}, ${max}]`))
  }
}

/** Valida o manifesto por campo. Contraste inválido para o nível declarado é erro (bloqueia). */
export function validateThemeManifest(manifest: ThemeManifest): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  if (manifest.schemaVersion !== THEME_MANIFEST_SCHEMA_VERSION) {
    errors.push(err('schemaVersion', 'SCHEMA_VERSION', `esperado ${THEME_MANIFEST_SCHEMA_VERSION}, recebido ${manifest.schemaVersion}`))
  }
  if (!THEME_ID_RE.test(manifest.themeId ?? '')) {
    errors.push(err('themeId', 'THEME_ID', 'themeId deve seguir o padrão ab-theme-<slug>'))
  }
  if (!Number.isInteger(manifest.version) || manifest.version < 1) {
    errors.push(err('version', 'VERSION', 'version deve ser inteiro >= 1'))
  }
  if (!manifest.origin || !Array.isArray(manifest.origin.overrides)) {
    errors.push(err('origin.overrides', 'ORIGIN_REQUIRED', 'origem com lista de overrides é obrigatória'))
  }

  const t = manifest.tokens
  if (!t) {
    errors.push(err('tokens', 'TOKENS_REQUIRED', 'tokens são obrigatórios'))
    return { ok: false, errors, warnings }
  }

  for (const key of COLOR_KEYS) {
    const v = (t.colors as Record<string, unknown>)[key]
    if (typeof v !== 'string' || !isHexColor(v)) {
      errors.push(err(`tokens.colors.${key}`, 'HEX_COLOR', `${key} deve ser cor hex #rrggbb`))
    }
  }

  if (typeof t.typography?.fontFamily !== 'string' || !t.typography.fontFamily.trim()) {
    errors.push(err('tokens.typography.fontFamily', 'STRING_REQUIRED', 'fontFamily é obrigatória'))
  }
  if (typeof t.typography?.fontFamilyHeading !== 'string' || !t.typography.fontFamilyHeading.trim()) {
    errors.push(err('tokens.typography.fontFamilyHeading', 'STRING_REQUIRED', 'fontFamilyHeading é obrigatória'))
  }
  checkNumber(errors, 'tokens.typography.baseSizePx', t.typography?.baseSizePx, 14, 24)
  checkNumber(errors, 'tokens.typography.scaleRatio', t.typography?.scaleRatio, 1.05, 1.5)
  checkNumber(errors, 'tokens.typography.lineHeightBody', t.typography?.lineHeightBody, 1.2, 1.8)
  checkNumber(errors, 'tokens.typography.lineHeightHeading', t.typography?.lineHeightHeading, 1.0, 1.4)

  checkNumber(errors, 'tokens.spacing.unitPx', t.spacing?.unitPx, 2, 12)
  checkNumber(errors, 'tokens.spacing.sectionY', t.spacing?.sectionY, 16, 160)
  checkNumber(errors, 'tokens.spacing.gutter', t.spacing?.gutter, 8, 48)

  checkNumber(errors, 'tokens.grid.containerMaxWidthPx', t.grid?.containerMaxWidthPx, 960, 1920)
  checkNumber(errors, 'tokens.grid.columns', t.grid?.columns, 4, 16)
  checkNumber(errors, 'tokens.grid.readingWidthCh', t.grid?.readingWidthCh, 45, 90)

  if (!['compact', 'comfortable', 'spacious'].includes(t.density)) {
    errors.push(err('tokens.density', 'ENUM', 'density deve ser compact|comfortable|spacious'))
  }
  if (!['none', 'subtle', 'rich'].includes(t.motion)) {
    errors.push(err('tokens.motion', 'ENUM', 'motion deve ser none|subtle|rich'))
  }
  if (!['AA', 'AAA'].includes(t.accessibility)) {
    errors.push(err('tokens.accessibility', 'ENUM', 'accessibility deve ser AA|AAA'))
  }

  if (t.accessibility === 'AAA' && errors.length === 0) {
    warnings.push(err('tokens.accessibility', 'AAA_STRICT', 'nível AAA exige 7:1 (4.5:1 texto grande) em todos os pares declarados'))
  }

  // Contraste — só avaliável quando as cores são hex válidas.
  const pairs = Array.isArray(manifest.contrastPairs) ? manifest.contrastPairs : []
  if (pairs.length === 0) {
    warnings.push(err('contrastPairs', 'NO_PAIRS', 'nenhum par de contraste declarado; validação de contraste não aplicada'))
  }
  for (const [i, pair] of pairs.entries()) {
    const path = `contrastPairs[${i}]`
    if (!COLOR_KEYS.includes(pair?.fg) || !COLOR_KEYS.includes(pair?.bg)) {
      errors.push(err(`${path}.fg|bg`, 'COLOR_KEY', 'fg/bg devem referenciar chaves de tokens.colors'))
      continue
    }
    if (typeof t.colors === 'object') {
      const ratio = contrastRatio(t.colors[pair.fg], t.colors[pair.bg])
      if (ratio == null) {
        errors.push(err(`${path}`, 'CONTRAST_UNCOMPUTABLE', 'cores inválidas impedem o cálculo de contraste'))
        continue
      }
      const large = pair.largeText === true
      const pass = t.accessibility === 'AAA' ? meetsAAA(ratio, large) : meetsAA(ratio, large)
      if (!pass) {
        errors.push(err(`${path}(${pair.name})`, 'CONTRAST_FAIL',
          `razão ${ratio.toFixed(2)}:1 abaixo do mínimo ${t.accessibility} (${large ? 3 : t.accessibility === 'AAA' ? 7 : 4.5}:1)`))
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
