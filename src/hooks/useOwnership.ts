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

export function useOwnership() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<{ at: number; data: Purchase[] } | null>(null)
  const CACHE_MS = 60_000

  const refresh = useCallback(async (force = false) => {
    if (!isTreasuryConfigured) {
      setPurchases([])
      return
    }
    const now = Date.now()
    if (
      !force &&
      cacheRef.current &&
      now - cacheRef.current.at < CACHE_MS
    ) {
      setPurchases(cacheRef.current.data)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPurchases(150)
      cacheRef.current = { at: Date.now(), data }
      setPurchases(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'RPC-Fehler'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
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
    error,
    refresh,
    isOwned,
    getOwner,
    selectionHasOwned,
  }
}
