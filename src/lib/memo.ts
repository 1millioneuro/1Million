import { MEMO_PREFIX, GRID_SIZE } from '../config'
import type { Selection } from '../types'

/**
 * Compact memo: EM1:x,y,w,h|name|url
 * Name/url are truncated to keep memo under ~500 bytes.
 */
export function encodeMemo(
  sel: Selection,
  name: string,
  url: string,
): string {
  const n = sanitize(name, 40)
  const u = sanitize(url, 120)
  return `${MEMO_PREFIX}${sel.x},${sel.y},${sel.w},${sel.h}|${n}|${u}`
}

export function decodeMemo(memo: string): {
  x: number
  y: number
  w: number
  h: number
  name: string
  url: string
} | null {
  if (!memo.startsWith(MEMO_PREFIX)) return null
  const body = memo.slice(MEMO_PREFIX.length)
  const [coords, name = '', url = ''] = body.split('|')
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
  return { x, y, w, h, name: name.slice(0, 40), url: url.slice(0, 120) }
}

function sanitize(s: string, max: number): string {
  return s.replace(/[|\n\r]/g, ' ').trim().slice(0, max)
}
