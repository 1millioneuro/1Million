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

/** Official public RPC — often rate-limited; used as a fallback. */
export const SOLANA_RPC_OFFICIAL = 'https://api.mainnet-beta.solana.com'

/** More reliable free public endpoints, tried in order. */
export const SOLANA_RPC_FALLBACKS = [
  'https://solana-rpc.publicnode.com',
  SOLANA_RPC_OFFICIAL,
  'https://rpc.ankr.com/solana',
] as const

function uniqueEndpoints(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of list) {
    const trimmed = url.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

/**
 * Ordered RPC URLs: optional custom env first, then public fallbacks.
 * `SOLANA_RPC` is the primary used by the wallet adapter.
 */
export const SOLANA_RPC_ENDPOINTS = uniqueEndpoints([
  (import.meta.env.VITE_SOLANA_RPC as string | undefined)?.trim() ?? '',
  ...SOLANA_RPC_FALLBACKS,
])

export const SOLANA_RPC = SOLANA_RPC_ENDPOINTS[0] ?? SOLANA_RPC_OFFICIAL

export const isTreasuryConfigured =
  !!TREASURY_WALLET &&
  TREASURY_WALLET !== PLACEHOLDER &&
  TREASURY_WALLET.length >= 32

/** Memo program id (Solana). */
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXkDLWxDzu'

/** Memo prefix so we only parse our purchases. */
export const MEMO_PREFIX = 'EM1:'
