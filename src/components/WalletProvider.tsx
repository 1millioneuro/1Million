import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SOLANA_RPC, SOLANA_RPC_ENDPOINTS } from '../config'
import { browserRpcFetch, createConnection } from '../lib/rpc'
import '@solana/wallet-adapter-react-ui/styles.css'

const connectionConfig = {
  commitment: 'confirmed' as const,
  fetch: browserRpcFetch,
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])
  const [endpoint, setEndpoint] = useState(SOLANA_RPC)

  useEffect(() => {
    let cancelled = false
    async function pickHealthy() {
      for (const url of SOLANA_RPC_ENDPOINTS) {
        try {
          const c = createConnection(url)
          await c.getSlot('confirmed')
          if (!cancelled) setEndpoint(url)
          return
        } catch {
          // official / keyless 403s skip immediately
        }
      }
    }
    void pickHealthy()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
