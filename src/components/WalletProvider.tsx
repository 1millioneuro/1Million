import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Connection } from '@solana/web3.js'
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SOLANA_RPC, SOLANA_RPC_ENDPOINTS } from '../config'
import '@solana/wallet-adapter-react-ui/styles.css'

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])
  const [endpoint, setEndpoint] = useState(SOLANA_RPC)

  useEffect(() => {
    let cancelled = false
    async function pickHealthy() {
      for (const url of SOLANA_RPC_ENDPOINTS) {
        try {
          const c = new Connection(url, 'confirmed')
          await c.getLatestBlockhash('confirmed')
          if (!cancelled) setEndpoint(url)
          return
        } catch {
          // try next public endpoint
        }
      }
    }
    void pickHealthy()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
