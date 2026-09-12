/** Grid is 1000×1000 = 1_000_000 pixels at €1 each. */
export const GRID_SIZE = 1000
export const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE
export const EUR_PER_PIXEL = 1

const PLACEHOLDER = 'REPLACE_WITH_PHANTOM_ADDRESS'

export const TREASURY_WALLET =
  (import.meta.env.VITE_TREASURY_WALLET as string | undefined)?.trim() ||
  PLACEHOLDER

export const SOL_PER_PIXEL = Number(
  import.meta.env.VITE_SOL_PER_PIXEL ?? '0.005',
)

/**
 * Official public hosts. Browsers (including GitHub Pages) get JSON-RPC
 * `403 Access forbidden` from these — never use them as the sole/default RPC.
 */
export const SOLANA_RPC_OFFICIAL_HOSTS = [
  'api.mainnet-beta.solana.com',
  'api.mainnet.solana.com',
] as const

export function isOfficialPublicRpc(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return SOLANA_RPC_OFFICIAL_HOSTS.includes(
      host as (typeof SOLANA_RPC_OFFICIAL_HOSTS)[number],
    )
  } catch {
    return false
  }
}

/**
 * CORS-friendly free public RPCs verified from the GitHub Pages origin
 * (2026-09-12): OPTIONS/POST allow `*`, `getSlot` + `getSignaturesForAddress` 200.
 * Ankr free and official mainnet return 403 from the browser — omitted.
 */
export const SOLANA_RPC_FALLBACKS = [
  'https://solana-rpc.publicnode.com',
  'https://solana.publicnode.com',
  'https://solana.leorpc.com/?api_key=FREE',
] as const

function uniqueEndpoints(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of list) {
    const trimmed = url.trim()
    if (!trimmed || isOfficialPublicRpc(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

/**
 * Ordered RPC URLs: optional custom env first (unless it is the official
 * 403 host), then public fallbacks. `SOLANA_RPC` is the wallet-adapter primary.
 */
export const SOLANA_RPC_ENDPOINTS = uniqueEndpoints([
  (import.meta.env.VITE_SOLANA_RPC as string | undefined)?.trim() ?? '',
  ...SOLANA_RPC_FALLBACKS,
])

export const SOLANA_RPC =
  SOLANA_RPC_ENDPOINTS[0] ?? SOLANA_RPC_FALLBACKS[0]

export const isTreasuryConfigured =
  !!TREASURY_WALLET &&
  TREASURY_WALLET !== PLACEHOLDER &&
  TREASURY_WALLET.length >= 32

/** Memo program id (Solana). */
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXkDLWxDzu'

/** Memo prefix so we only parse our purchases. */
export const MEMO_PREFIX = 'EM1:'
