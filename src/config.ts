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

export const SOLANA_RPC =
  (import.meta.env.VITE_SOLANA_RPC as string | undefined)?.trim() ||
  'https://api.mainnet-beta.solana.com'

export const isTreasuryConfigured =
  !!TREASURY_WALLET &&
  TREASURY_WALLET !== PLACEHOLDER &&
  TREASURY_WALLET.length >= 32

/** Memo program id (Solana). */
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXkDLWxDzu'

/** Memo prefix so we only parse our purchases. */
export const MEMO_PREFIX = 'EM1:'
