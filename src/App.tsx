import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ProgressBar } from './components/ProgressBar'
import { PixelCanvas } from './components/PixelCanvas'
import { BuyModal } from './components/BuyModal'
import { BuyersList } from './components/BuyersList'
import { ShareButtons } from './components/ShareButtons'
import { useOwnership } from './hooks/useOwnership'
import {
  isTreasuryConfigured,
  TREASURY_WALLET,
  TOTAL_PIXELS,
} from './config'
import type { Selection } from './types'
import './App.css'

export default function App() {
  const {
    purchases,
    ownerMap,
    pixelsSold,
    loading,
    notice,
    refresh,
    getOwner,
    selectionHasOwned,
  } = useOwnership()

  const [selection, setSelection] = useState<Selection | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function handleSelect(sel: Selection) {
    setSelection(sel)
  }

  function handleSuccess(sig: string) {
    setSelection(null)
    setToast(`Purchase confirmed! Tx: ${sig.slice(0, 8)}…`)
    void refresh(true)
    setTimeout(() => setToast(null), 6000)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">1M</span>
          <div>
            <h1>OneMillion</h1>
            <p className="tagline">1,000,000 Pixels · €1,000,000</p>
          </div>
        </div>
        <div className="topbar-actions">
          <WalletMultiButton />
        </div>
      </header>

      <main className="layout">
        <section className="hero panel">
          <h2>1,000,000 pixels. Goal: €1,000,000</h2>
          <p>
            A social experiment: buy from <strong>€1</strong> (1 pixel) —
            more is welcome. Every payment is a transparent{' '}
            <strong>Phantom (Solana)</strong> transfer to a public treasury.
          </p>
          <ProgressBar pixelsSold={pixelsSold} />
          <div className="hero-meta">
            <ShareButtons />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void refresh(true)}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh on-chain'}
            </button>
          </div>
          {isTreasuryConfigured ? (
            <p className="transparency">
              Transparency:{' '}
              <a
                href={`https://solscan.io/account/${TREASURY_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View treasury on Solscan ↗
              </a>
            </p>
          ) : (
            <p className="banner warn">
              Demo mode: treasury wallet is not set. Purchases stay disabled
              until <code>VITE_TREASURY_WALLET</code> is configured.
            </p>
          )}
          {notice && (
            <p className="banner info">
              {notice}{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => void refresh(true)}
                disabled={loading}
              >
                Retry now
              </button>
            </p>
          )}
        </section>

        <section className="grid-section panel">
          <div className="grid-header">
            <h2>Pixel grid (1000×1000)</h2>
            <p className="muted">
              Drag a rectangle to buy · {pixelsSold.toLocaleString('en-US')} /{' '}
              {TOTAL_PIXELS.toLocaleString('en-US')} sold
            </p>
          </div>
          <PixelCanvas
            ownerMap={ownerMap}
            onSelect={handleSelect}
            getOwner={getOwner}
          />
        </section>

        <BuyersList purchases={purchases} loading={loading} />
      </main>

      <footer className="footer">
        <p>
          OneMillion — a social experiment. Not an investment offer. Payments
          are final on-chain transfers.
        </p>
      </footer>

      {selection && (
        <BuyModal
          selection={selection}
          hasOwned={selectionHasOwned(
            selection.x,
            selection.y,
            selection.w,
            selection.h,
          )}
          onClose={() => setSelection(null)}
          onSuccess={handleSuccess}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
