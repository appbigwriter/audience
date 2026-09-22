/**
 * Presets por nicho — dados versionados, não decisão (AB-S3-001/S3-002).
 * Presets são ponto de partida; a resolução final herda template → nicho → Persona → overrides aprovados.
 */
import type { DensityLevel, ThemeTokens } from './theme-manifest'

export type NichePreset = {
  id: string
  niche: string
  label: string
  version: number
  tokens: ThemeTokens
  imageDirection?: string
  notes?: string
}

const base: ThemeTokens = {
  colors: {
    background: '#fdfcf9',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    text: '#1f2933',
    textMuted: '#52606d',
    primary: '#0f62fe',
    primaryText: '#ffffff',
    border: '#d9e2ec',
    focusRing: '#0f62fe',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    fontFamilyHeading: '"Source Serif 4", Georgia, serif',
    baseSizePx: 17,
    scaleRatio: 1.25,
    lineHeightBody: 1.65,
    lineHeightHeading: 1.2,
  },
  spacing: { unitPx: 8, sectionY: 64, gutter: 24 },
  grid: { containerMaxWidthPx: 1200, columns: 12, readingWidthCh: 68 },
  density: 'comfortable' as DensityLevel,
  motion: 'subtle',
  accessibility: 'AA',
}

type VariantOver = {
  niche: string, label: string, id: string,
  tokens?: { colors?: Partial<ThemeTokens['colors']>, typography?: Partial<ThemeTokens['typography']>, spacing?: Partial<ThemeTokens['spacing']>, grid?: Partial<ThemeTokens['grid']>, density?: ThemeTokens['density'] },
  imageDirection?: string, notes?: string
}

function variant(over: VariantOver): NichePreset {
  const tokens: ThemeTokens = {
    ...base,
    ...over.tokens,
    colors: { ...base.colors, ...(over.tokens?.colors ?? {}) },
    typography: { ...base.typography, ...(over.tokens?.typography ?? {}) },
    spacing: { ...base.spacing, ...(over.tokens?.spacing ?? {}) },
    grid: { ...base.grid, ...(over.tokens?.grid ?? {}) },
  }
  return { id: over.id, niche: over.niche, label: over.label, version: 1, tokens, imageDirection: over.imageDirection, notes: over.notes }
}

export const NICHE_PRESETS: NichePreset[] = [
  variant({ id: 'niche-editorial-guia', niche: 'guias-e-referencia', label: 'Guia/Referência', imageDirection: 'documentary' }),
  variant({
    id: 'niche-reviews-comparativos', niche: 'reviews-e-comparativos', label: 'Reviews/Comparativos',
    tokens: { colors: { primary: '#b45309', primaryText: '#ffffff', focusRing: '#b45309' } },
    imageDirection: 'product-studio',
  }),
  variant({
    id: 'niche-financas-pessoais', niche: 'financas-pessoais', label: 'Finanças Pessoais',
    tokens: { colors: { primary: '#065f46', primaryText: '#ffffff', focusRing: '#065f46' } },
    imageDirection: 'editorial-clean',
  }),
  variant({
    id: 'niche-casa-jardim', niche: 'casa-e-jardim', label: 'Casa/Jardim',
    tokens: { colors: { primary: '#3f6212', primaryText: '#ffffff', focusRing: '#3f6212', surfaceAlt: '#f3f6ec' } },
    imageDirection: 'natural-lifestyle',
  }),
  variant({
    id: 'niche-lifestyle', niche: 'lifestyle', label: 'Lifestyle',
    tokens: { density: 'spacious', grid: { readingWidthCh: 62 } },
    imageDirection: 'lifestyle-warm',
  }),
  variant({
    id: 'niche-noticias', niche: 'noticias-e-atualizacoes', label: 'Notícias/Atualizações',
    tokens: { density: 'compact', typography: { baseSizePx: 16 }, grid: { readingWidthCh: 72 } },
    imageDirection: 'photojournalism',
  }),
]

export function findNichePreset(id: string): NichePreset | undefined {
  return NICHE_PRESETS.find(p => p.id === id)
}
