/** Geração determinística de CSS variables a partir de tokens resolvidos (usado por preview e surfaces de UI). */
import type { ThemeTokens } from './theme-manifest'

export type CssVarMap = Record<string, string>

function typeScale(tokens: ThemeTokens): string[] {
  const steps = ['sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl']
  const sizes: number[] = []
  let size = tokens.typography.baseSizePx / Math.pow(tokens.typography.scaleRatio, 2)
  for (let i = 0; i < steps.length; i++) {
    sizes.push(Math.round(size * 100) / 100)
    size *= tokens.typography.scaleRatio
  }
  return steps.map((s, i) => `--ab-font-${s}: ${sizes[i]}px`)
}

export function tokensToCssVariables(tokens: ThemeTokens): CssVarMap {
  const map: CssVarMap = {
    '--ab-color-background': tokens.colors.background,
    '--ab-color-surface': tokens.colors.surface,
    '--ab-color-surface-alt': tokens.colors.surfaceAlt,
    '--ab-color-text': tokens.colors.text,
    '--ab-color-text-muted': tokens.colors.textMuted,
    '--ab-color-primary': tokens.colors.primary,
    '--ab-color-primary-text': tokens.colors.primaryText,
    '--ab-color-border': tokens.colors.border,
    '--ab-color-focus-ring': tokens.colors.focusRing,
    '--ab-font-body': tokens.typography.fontFamily,
    '--ab-font-heading': tokens.typography.fontFamilyHeading,
    '--ab-leading-body': String(tokens.typography.lineHeightBody),
    '--ab-leading-heading': String(tokens.typography.lineHeightHeading),
    '--ab-space-unit': `${tokens.spacing.unitPx}px`,
    '--ab-space-section-y': `${tokens.spacing.sectionY}px`,
    '--ab-space-gutter': `${tokens.spacing.gutter}px`,
    '--ab-container-max': `${tokens.grid.containerMaxWidthPx}px`,
    '--ab-reading-width': `${tokens.grid.readingWidthCh}ch`,
    '--ab-columns': String(tokens.grid.columns),
    '--ab-density': tokens.density,
    '--ab-motion': tokens.motion,
  }
  for (const line of typeScale(tokens)) {
    const [name, value] = line.split(': ')
    map[name] = value
  }
  return map
}

export function cssVariablesToBlock(vars: CssVarMap): string {
  return ':root {\n' + Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}'
}
