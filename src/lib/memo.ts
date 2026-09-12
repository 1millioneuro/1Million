import { MEMO_PREFIX, GRID_SIZE } from '../config'
import { DEFAULT_PIXEL_COLOR, normalizeHexColor } from './colors'
import type { Selection } from '../types'

export interface DecodedMemo {
  x: number
  y: number
  w: number
  h: number
  name: string
  url: string
  /** Canonical #RRGGBB when the memo included a color; otherwise null. */
  color: string | null
}

/**
 * Compact memo, backward compatible:
 *   New: EM1:x,y,w,h|#RRGGBB|name|url
 *   Old: EM1:x,y,w,h|name|url   (no color — renderer hashes a fallback)
 * Name/url are truncated to keep memo under ~500 bytes.
 */
export function encodeMemo(
  sel: Selection,
  name: string,
  url: string,
  color: string = DEFAULT_PIXEL_COLOR,
): string {
  const n = sanitize(name, 40)
  const u = sanitize(url, 120)
  const hex = normalizeHexColor(color) ?? DEFAULT_PIXEL_COLOR
  return `${MEMO_PREFIX}${sel.x},${sel.y},${sel.w},${sel.h}|${hex}|${n}|${u}`
}

export function decodeMemo(memo: string): DecodedMemo | null {
  if (!memo.startsWith(MEMO_PREFIX)) return null
  const body = memo.slice(MEMO_PREFIX.length)
  const [coords, ...rest] = body.split('|')
  const parts = coords.split(',').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null
  const [x, y, w, h] = parts
  if (
    x < 0 ||
    y < 0 ||
    w < 1 ||
    h < 1 ||
    x + w > GRID_SIZE ||
    y + h > GRID_SIZE
  ) {
    return null
  }

  const maybeColor = rest[0] ? normalizeHexColor(rest[0]) : null
  let name = ''
  let url = ''
  let color: string | null = null

  if (maybeColor) {
    color = maybeColor
    name = rest[1] ?? ''
    url = rest[2] ?? ''
  } else {
    name = rest[0] ?? ''
    url = rest[1] ?? ''
  }

  return {
    x,
    y,
    w,
    h,
    name: name.slice(0, 40),
    url: url.slice(0, 120),
    color,
  }
}

function sanitize(s: string, max: number): string {
  return s.replace(/[|\n\r]/g, ' ').trim().slice(0, max)
}
