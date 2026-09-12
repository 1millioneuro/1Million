import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchPurchases } from '../lib/solana'
import { GRID_SIZE, isTreasuryConfigured } from '../config'
import type { Purchase } from '../types'

export type OwnerMap = Map<number, Purchase> // key = y * GRID_SIZE + x

function applyOwnership(purchases: Purchase[]): OwnerMap {
  const map: OwnerMap = new Map()
  // Chronological (oldest first) so first buyer wins
  const chrono = [...purchases].sort((a, b) => a.timestamp - b.timestamp)
  for (const p of chrono) {
    for (let dy = 0; dy < p.h; dy++) {
      for (let dx = 0; dx < p.w; dx++) {
        const key = (p.y + dy) * GRID_SIZE + (p.x + dx)
        if (!map.has(key)) {
          map.set(key, p)
        }
      }
    }
  }
  return map
}

const CACHE_MS = 60_000
const RETRY_BASE_MS = 8_000
const RETRY_MAX_MS = 60_000

export function useOwnership() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const cacheRef = useRef<{ at: number; data: Purchase[] } | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const inflightRef = useRef(false)

  const clearRetry = () => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }
  }

  const refresh = useCallback(async function refreshOwnership(force = false) {
    if (!isTreasuryConfigured) {
      setPurchases([])
      setNotice(null)
      return
    }
    if (inflightRef.current) return
    const now = Date.now()
    if (
      !force &&
      cacheRef.current &&
      now - cacheRef.current.at < CACHE_MS
    ) {
      setPurchases(cacheRef.current.data)
      return
    }
    inflightRef.current = true
    setLoading(true)
    try {
      const data = await fetchPurchases(150)
      cacheRef.current = { at: Date.now(), data }
      setPurchases(data)
      setNotice(null)
      attemptRef.current = 0
      clearRetry()
    } catch {
      attemptRef.current += 1
      // Keep last good data; never block the page on public-RPC flakes.
      setNotice(
        'Ownership map is temporarily delayed (public RPC). The grid stays usable — retrying quietly.',
      )
      clearRetry()
      const delay = Math.min(
        RETRY_MAX_MS,
        RETRY_BASE_MS * 2 ** Math.min(attemptRef.current - 1, 3),
      )
      retryRef.current = setTimeout(() => {
        void refreshOwnership(true)
      }, delay)
    } finally {
      inflightRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => clearRetry()
  }, [refresh])

  const ownerMap = useMemo(() => applyOwnership(purchases), [purchases])

  const pixelsSold = ownerMap.size
  const isOwned = useCallback(
    (x: number, y: number) => ownerMap.has(y * GRID_SIZE + x),
    [ownerMap],
  )
  const getOwner = useCallback(
    (x: number, y: number) => ownerMap.get(y * GRID_SIZE + x) ?? null,
    [ownerMap],
  )

  const selectionHasOwned = useCallback(
    (x: number, y: number, w: number, h: number) => {
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (ownerMap.has((y + dy) * GRID_SIZE + (x + dx))) return true
        }
      }
      return false
    },
    [ownerMap],
  )

  return {
    purchases,
    ownerMap,
    pixelsSold,
    loading,
    notice,
    refresh,
    isOwned,
    getOwner,
    selectionHasOwned,
  }
}
