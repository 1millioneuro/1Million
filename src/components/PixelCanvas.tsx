import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { GRID_SIZE } from '../config'
import type { HoverInfo, Purchase, Selection } from '../types'
import type { OwnerMap } from '../hooks/useOwnership'

interface Props {
  ownerMap: OwnerMap
  onSelect: (sel: Selection) => void
  getOwner: (x: number, y: number) => Purchase | null
}

type Mode = 'idle' | 'pan' | 'select'

export function PixelCanvas({ ownerMap, onSelect, getOwner }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const view = useRef({
    scale: 1,
    ox: 0,
    oy: 0,
  })
  const drag = useRef<{
    mode: Mode
    startX: number
    startY: number
    origOx: number
    origOy: number
    selStart: { x: number; y: number } | null
    selCurrent: { x: number; y: number } | null
    moved: boolean
  }>({
    mode: 'idle',
    startX: 0,
    startY: 0,
    origOx: 0,
    origOy: 0,
    selStart: null,
    selCurrent: null,
    moved: false,
  })

  const ownedSnapshot = useRef<OwnerMap>(ownerMap)
  ownedSnapshot.current = ownerMap

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const { scale, ox, oy } = view.current

    // background
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)

    // grid board
    ctx.fillStyle = '#161b22'
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE)

    // faint grid lines when zoomed in
    if (scale >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1 / scale
      ctx.beginPath()
      const step = scale >= 12 ? 1 : 10
      for (let i = 0; i <= GRID_SIZE; i += step) {
        ctx.moveTo(i, 0)
        ctx.lineTo(i, GRID_SIZE)
        ctx.moveTo(0, i)
        ctx.lineTo(GRID_SIZE, i)
      }
      ctx.stroke()
    }

    // owned pixels — draw as rects per purchase region (efficient)
    const drawn = new Set<string>()
    for (const p of ownedSnapshot.current.values()) {
      const key = p.signature
      if (drawn.has(key)) continue
      drawn.add(key)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.w, p.h)
      if (scale >= 6) {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 1 / scale
        ctx.strokeRect(p.x + 0.5 / scale, p.y + 0.5 / scale, p.w - 1 / scale, p.h - 1 / scale)
      }
    }

    // border
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(0, 0, GRID_SIZE, GRID_SIZE)

    // selection
    const { selStart, selCurrent } = drag.current
    if (selStart && selCurrent) {
      const x = Math.min(selStart.x, selCurrent.x)
      const y = Math.min(selStart.y, selCurrent.y)
      const sw = Math.abs(selCurrent.x - selStart.x) + 1
      const sh = Math.abs(selCurrent.y - selStart.y) + 1
      ctx.fillStyle = 'rgba(88, 166, 255, 0.35)'
      ctx.fillRect(x, y, sw, sh)
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 2 / scale
      ctx.strokeRect(x, y, sw, sh)
    }

    ctx.restore()
  }, [])

  useEffect(() => {
    draw()
  }, [draw, ownerMap])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const fit = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      const s = Math.min(w, h) / GRID_SIZE
      view.current.scale = Math.max(0.3, s * 0.92)
      view.current.ox = (w - GRID_SIZE * view.current.scale) / 2
      view.current.oy = (h - GRID_SIZE * view.current.scale) / 2
      draw()
    }
    fit()

    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  function screenToGrid(clientX: number, clientY: number) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const { scale, ox, oy } = view.current
    const gx = Math.floor((sx - ox) / scale)
    const gy = Math.floor((sy - oy) / scale)
    return {
      x: Math.max(0, Math.min(GRID_SIZE - 1, gx)),
      y: Math.max(0, Math.min(GRID_SIZE - 1, gy)),
      inside: gx >= 0 && gy >= 0 && gx < GRID_SIZE && gy < GRID_SIZE,
    }
  }

  function onPointerDown(e: ReactPointerEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)

    const isPan =
      e.button === 1 ||
      e.button === 2 ||
      e.altKey ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey

    const g = screenToGrid(e.clientX, e.clientY)
    drag.current.startX = e.clientX
    drag.current.startY = e.clientY
    drag.current.origOx = view.current.ox
    drag.current.origOy = view.current.oy
    drag.current.moved = false

    if (isPan || e.button === 2) {
      drag.current.mode = 'pan'
      drag.current.selStart = null
      drag.current.selCurrent = null
    } else if (e.button === 0 && g.inside) {
      drag.current.mode = 'select'
      drag.current.selStart = { x: g.x, y: g.y }
      drag.current.selCurrent = { x: g.x, y: g.y }
      draw()
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    const g = screenToGrid(e.clientX, e.clientY)
    if (g.inside) {
      setHover({ x: g.x, y: g.y, purchase: getOwner(g.x, g.y) })
    } else {
      setHover(null)
    }

    const d = drag.current
    if (d.mode === 'idle') return

    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true

    if (d.mode === 'pan') {
      view.current.ox = d.origOx + dx
      view.current.oy = d.origOy + dy
      draw()
    } else if (d.mode === 'select' && d.selStart) {
      d.selCurrent = { x: g.x, y: g.y }
      draw()
    }
  }

  function onPointerUp(_e: ReactPointerEvent) {
    const d = drag.current
    if (d.mode === 'select' && d.selStart && d.selCurrent) {
      const x = Math.min(d.selStart.x, d.selCurrent.x)
      const y = Math.min(d.selStart.y, d.selCurrent.y)
      const w = Math.abs(d.selCurrent.x - d.selStart.x) + 1
      const h = Math.abs(d.selCurrent.y - d.selStart.y) + 1
      d.selStart = null
      d.selCurrent = null
      d.mode = 'idle'
      draw()
      onSelect({ x, y, w, h })
      return
    }
    d.mode = 'idle'
    d.selStart = null
    d.selCurrent = null
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { scale, ox, oy } = view.current
    const zoom = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const next = Math.max(0.25, Math.min(40, scale * zoom))
    const gx = (mx - ox) / scale
    const gy = (my - oy) / scale
    view.current.scale = next
    view.current.ox = mx - gx * next
    view.current.oy = my - gy * next
    draw()
  }

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="pixel-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="canvas-hint">
        Drag = select · Shift/right-click = pan · Scroll = zoom
      </div>
      {hover && (
        <div className="hover-tooltip">
          ({hover.x}, {hover.y})
          {hover.purchase
            ? ` · ${hover.purchase.name || 'Anonymous'} · ${hover.purchase.w}×${hover.purchase.h}`
            : ' · free'}
        </div>
      )}
    </div>
  )
}
