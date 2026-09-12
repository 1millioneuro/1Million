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
    error,
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
    setToast(`Kauf erfolgreich! Tx: ${sig.slice(0, 8)}…`)
    void refresh(true)
    setTimeout(() => setToast(null), 6000)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">1M</span>
          <div>
            <h1>EineMillion</h1>
            <p className="tagline">Soziales Experiment · 1 Pixel = 1 €</p>
          </div>
        </div>
        <div className="topbar-actions">
          <WalletMultiButton />
        </div>
      </header>

      <main className="layout">
        <section className="hero panel">
          <h2>1.000.000 Pixel. Ziel: 1.000.000 €</h2>
          <p>
            Ein soziales Experiment: Kaufe ab <strong>1 €</strong> (1 Pixel) –
            mehr ist erlaubt. Alle Zahlungen laufen transparent über{' '}
            <strong>Phantom (Solana)</strong> an eine öffentliche Treasury.
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
              {loading ? 'Aktualisiere…' : 'On-Chain aktualisieren'}
            </button>
          </div>
          {isTreasuryConfigured ? (
            <p className="transparency">
              Transparenz:{' '}
              <a
                href={`https://solscan.io/account/${TREASURY_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Treasury auf Solscan ansehen ↗
              </a>
            </p>
          ) : (
            <p className="banner warn">
              Demo-Modus: Treasury-Wallet noch nicht gesetzt. Käufe sind
              deaktiviert, bis <code>VITE_TREASURY_WALLET</code> konfiguriert
              ist.
            </p>
          )}
          {error && (
            <p className="banner error">
              RPC: {error} (öffentliche RPCs sind oft limitiert)
            </p>
          )}
        </section>

        <section className="grid-section panel">
          <div className="grid-header">
            <h2>Pixel-Grid (1000×1000)</h2>
            <p className="muted">
              Rechteck aufziehen zum Kaufen · {pixelsSold.toLocaleString('de-DE')} /{' '}
              {TOTAL_PIXELS.toLocaleString('de-DE')} verkauft
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
          EineMillion – soziales Experiment. Kein Investmentversprechen. Zahlungen
          sind finale On-Chain-Transfers.
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
