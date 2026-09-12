/** Default fill for a new purchase — matches the site accent. */
export const DEFAULT_PIXEL_COLOR = '#58A6FF'

/** Deterministic pastel-ish color from a wallet address / signature. */
export function colorFromSeed(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const h = Math.abs(hash) % 360
  const s = 55 + (Math.abs(hash >> 8) % 25)
  const l = 42 + (Math.abs(hash >> 16) % 18)
  return `hsl(${h} ${s}% ${l}%)`
}

/** Accept #RGB or #RRGGBB; return canonical #RRGGBB or null. */
export function normalizeHexColor(input: string): string | null {
  const s = input.trim()
  const short = /^#([0-9A-Fa-f]{3})$/.exec(s)
  if (short) {
    const [r, g, b] = short[1]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  const full = /^#([0-9A-Fa-f]{6})$/.exec(s)
  if (full) return `#${full[1]}`.toUpperCase()
  return null
}

export function isHexColor(input: string): boolean {
  return normalizeHexColor(input) !== null
}
