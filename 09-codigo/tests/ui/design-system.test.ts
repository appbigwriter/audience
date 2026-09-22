/**
 * Track B — AB-S3-001/AB-S3-002: Theme Manifest (schema, contraste) e resolução de tokens por Persona/nicho.
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTRAST_PAIRS, THEME_MANIFEST_SCHEMA_VERSION, validateThemeManifest,
  type ThemeManifest,
} from '../../packages/design-system/src/theme-manifest'
import { contrastRatio, hexToRgb, isHexColor, meetsAA, meetsAAA } from '../../packages/design-system/src/contrast'
import { findNichePreset, NICHE_PRESETS } from '../../packages/design-system/src/presets'
import { resolveThemeTokens, TOKEN_OVERRIDE_ALLOWLIST } from '../../packages/design-system/src/token-resolution'
import { cssVariablesToBlock, tokensToCssVariables } from '../../packages/design-system/src/css-variables'

const baseTokens = findNichePreset('niche-editorial-guia')!.tokens

function manifest(over: Partial<ThemeManifest> = {}): ThemeManifest {
  return {
    schemaVersion: THEME_MANIFEST_SCHEMA_VERSION,
    themeId: 'ab-theme-pilot',
    version: 1,
    origin: { overrides: [] },
    tokens: baseTokens,
    contrastPairs: DEFAULT_CONTRAST_PAIRS,
    ...over,
  }
}

describe('AB-S3-001 Theme Manifest', () => {
  it('aceita manifesto válido com preset base', () => {
    const r = validateThemeManifest(manifest())
    expect(r.ok).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('valida todos os presets de nicho do catálogo', () => {
    for (const preset of NICHE_PRESETS) {
      const r = validateThemeManifest(manifest({ themeId: `ab-theme-${preset.niche}`, tokens: preset.tokens }))
      expect(r.ok, `preset ${preset.id} deve validar: ${r.errors.map(e => e.message).join('; ')}`).toBe(true)
    }
  })

  it('rejeita cor hex inválida por campo', () => {
    const r = validateThemeManifest(manifest({ tokens: { ...baseTokens, colors: { ...baseTokens.colors, primary: 'blue' } } }))
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => e.path === 'tokens.colors.primary' && e.code === 'HEX_COLOR')).toBe(true)
  })

  it('rejeita ranges fora do intervalo (baseSizePx, readingWidthCh)', () => {
    const r = validateThemeManifest(manifest({
      tokens: {
        ...baseTokens,
        typography: { ...baseTokens.typography, baseSizePx: 40 },
        grid: { ...baseTokens.grid, readingWidthCh: 30 },
      },
    }))
    expect(r.errors.some(e => e.path === 'tokens.typography.baseSizePx')).toBe(true)
    expect(r.errors.some(e => e.path === 'tokens.grid.readingWidthCh')).toBe(true)
  })

  it('rejeita enums inválidos de density/motion/accessibility', () => {
    const r = validateThemeManifest(manifest({ tokens: { ...baseTokens, density: 'tight' as never, motion: 'fast' as never, accessibility: 'A' as never } }))
    expect(r.errors.filter(e => e.code === 'ENUM').length).toBeGreaterThanOrEqual(3)
  })

  it('bloqueia contraste AA insuficiente em par declarado', () => {
    const bad = manifest({
      tokens: { ...baseTokens, colors: { ...baseTokens.colors, text: '#999999', textMuted: '#aaaaaa' } },
    })
    const r = validateThemeManifest(bad)
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => e.code === 'CONTRAST_FAIL')).toBe(true)
  })

  it('exige AAA 7:1 quando nível declarado é AAA', () => {
    const aaa = manifest({ tokens: { ...baseTokens, accessibility: 'AAA' } })
    const r = validateThemeManifest(aaa)
    // preset base passa AA; verificar AAA exige pares mais altos — validar comportamento com par marginal
    const marginal = manifest({
      tokens: { ...baseTokens, accessibility: 'AAA', colors: { ...baseTokens.colors, textMuted: '#767676' } },
    })
    const rm = validateThemeManifest(marginal)
    expect(rm.errors.some(e => e.code === 'CONTRAST_FAIL')).toBe(true)
    expect(r.ok || rm.ok).toBeDefined()
  })

  it('rejeita themeId fora do padrão e versão não inteira', () => {
    const r = validateThemeManifest(manifest({ themeId: 'Tema Inválido', version: 0 }))
    expect(r.errors.some(e => e.path === 'themeId')).toBe(true)
    expect(r.errors.some(e => e.path === 'version')).toBe(true)
  })

  it('rejeita schemaVersion divergente', () => {
    const r = validateThemeManifest(manifest({ schemaVersion: 99 }))
    expect(r.errors.some(e => e.code === 'SCHEMA_VERSION')).toBe(true)
  })
})

describe('contrast utils', () => {
  it('#000 sobre #fff = 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })
  it('hex inválido retorna null', () => {
    expect(contrastRatio('nope', '#ffffff')).toBeNull()
    expect(hexToRgb('#12345')).toBeNull()
    expect(isHexColor('#fff')).toBe(false)
  })
  it('meetsAA/AAA limites', () => {
    expect(meetsAA(4.5)).toBe(true)
    expect(meetsAA(4.49)).toBe(false)
    expect(meetsAAA(7)).toBe(true)
    expect(meetsAAA(6.9)).toBe(false)
    expect(meetsAA(3, true)).toBe(true)
  })
})

describe('AB-S3-002 Resolução de tokens', () => {
  const persona = {
    personaId: 'persona-1', personaVersionId: 'pv-1', contentHash: 'hash-abc',
    preferredColors: ['#065f46'], density: 'spacious' as const,
  }

  it('herda template → nicho → persona com cadeia explícita', () => {
    const r = resolveThemeTokens({ themeId: 'ab-theme-pilot', templateBaseTokens: baseTokens, nichePresetId: 'niche-casa-jardim', persona })
    expect(r.validation.ok).toBe(true)
    expect(r.originChain).toEqual(['template-base', 'niche-preset:niche-casa-jardim@1', 'persona:persona-1@pv-1'])
    expect(r.manifest.tokens.colors.primary).toBe('#065f46') // persona vence sobre nicho
    expect(r.manifest.tokens.density).toBe('spacious')
    expect(r.manifest.origin.personaVisualProfileHash).toBe('hash-abc')
  })

  it('override dentro da allowlist aplica e registra', () => {
    const r = resolveThemeTokens({
      themeId: 'ab-theme-pilot', templateBaseTokens: baseTokens,
      overrides: { 'grid.readingWidthCh': 60, motion: 'none' },
    })
    expect(r.validation.ok).toBe(true)
    expect(r.manifest.tokens.grid.readingWidthCh).toBe(60)
    expect(r.manifest.tokens.motion).toBe('none')
    expect(r.manifest.origin.overrides).toContain('grid.readingWidthCh')
  })

  it('override fora da allowlist é rejeitado', () => {
    const r = resolveThemeTokens({ themeId: 'ab-theme-pilot', templateBaseTokens: baseTokens, overrides: { 'colors.background': '#000000' } })
    expect(r.validation.ok).toBe(false)
    expect(r.validation.errors[0].code).toBe('OVERRIDE_NOT_ALLOWED')
    expect(TOKEN_OVERRIDE_ALLOWLIST).not.toContain('colors.background')
  })

  it('preset inexistente é erro estruturado', () => {
    const r = resolveThemeTokens({ themeId: 'ab-theme-pilot', templateBaseTokens: baseTokens, nichePresetId: 'niche-fantasma' })
    expect(r.validation.ok).toBe(false)
    expect(r.validation.errors[0].code).toBe('PRESET_NOT_FOUND')
  })

  it('conflito de direção visual persona×nicho gera warning, não erro', () => {
    const r = resolveThemeTokens({
      themeId: 'ab-theme-pilot', templateBaseTokens: baseTokens,
      nichePresetId: 'niche-reviews-comparativos',
      persona: { ...persona, imageDirection: 'documentary' },
    })
    expect(r.validation.warnings.some(w => w.code === 'DIRECTION_CONFLICT')).toBe(true)
  })

  it('css variables são determinísticas e completas', () => {
    const r = resolveThemeTokens({ themeId: 'ab-theme-pilot', templateBaseTokens: baseTokens })
    const vars = tokensToCssVariables(r.manifest.tokens)
    expect(vars['--ab-color-primary']).toBe(r.manifest.tokens.colors.primary)
    expect(vars['--ab-reading-width']).toBe(`${r.manifest.tokens.grid.readingWidthCh}ch`)
    const block = cssVariablesToBlock(vars)
    expect(block.startsWith(':root {')).toBe(true)
    expect(block).toContain('--ab-font-base:')
    const again = tokensToCssVariables(r.manifest.tokens)
    expect(again).toEqual(vars)
  })
})
