/** Cálculo de contraste WCAG 2.x — usado para validar tokens detectáveis (AB-S3-001). */
export type Rgb = { r: number; g: number; b: number }

const HEX_RE = /^#([0-9a-fA-F]{6})$/

export function hexToRgb(hex: string): Rgb | null {
  const m = HEX_RE.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function isHexColor(hex: string): boolean {
  return HEX_RE.test(hex.trim())
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}

/** Retorna a razão de contraste (1..21) ou null se alguma cor for inválida. */
export function contrastRatio(fg: string, bg: string): number | null {
  const a = hexToRgb(fg)
  const b = hexToRgb(bg)
  if (!a || !b) return null
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

export function meetsAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? 3 : 4.5)
}

export function meetsAAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? 4.5 : 7)
}
