/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TREASURY_WALLET: string
  readonly VITE_SOL_PER_PIXEL: string
  readonly VITE_SOLANA_RPC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
