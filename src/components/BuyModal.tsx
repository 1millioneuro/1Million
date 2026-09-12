import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  buildPurchaseTransaction,
  eurForSelection,
  pixelsInSelection,
  solForSelection,
} from '../lib/solana'
import { isTreasuryConfigured, SOL_PER_PIXEL, TREASURY_WALLET } from '../config'
import type { Selection } from '../types'

interface Props {
  selection: Selection
  hasOwned: boolean
  onClose: () => void
  onSuccess: (signature: string) => void
}

export function BuyModal({ selection, hasOwned, onClose, onSuccess }: Props) {
  const { publicKey, sendTransaction, connected, connecting } = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pixels = pixelsInSelection(selection)
  const eur = eurForSelection(selection)
  const sol = solForSelection(selection)

  const treasuryOk = isTreasuryConfigured

  const canPay = useMemo(
    () => treasuryOk && connected && !hasOwned && pixels > 0 && !busy,
    [treasuryOk, connected, hasOwned, pixels, busy],
  )

  async function pay() {
    setError(null)
    if (!treasuryOk) {
      setError(
        'Treasury-Wallet fehlt. Setze VITE_TREASURY_WALLET auf deine Phantom-Adresse.',
      )
      return
    }
    if (!publicKey) {
      setVisible(true)
      return
    }
    if (hasOwned) {
      setError('Auswahl enthält bereits verkaufte Pixel.')
      return
    }
    setBusy(true)
    try {
      const tx = await buildPurchaseTransaction(publicKey, selection, name, url)
      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')
      onSuccess(sig)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Transaktion fehlgeschlagen'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="buy-title"
      >
        <header className="modal-header">
          <h2 id="buy-title">Pixel kaufen</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        </header>

        <p className="modal-sel">
          Auswahl:{' '}
          <strong>
            ({selection.x}, {selection.y}) · {selection.w}×{selection.h}
          </strong>{' '}
          = <strong>{pixels.toLocaleString('de-DE')} Pixel</strong>
        </p>

        {hasOwned && (
          <p className="banner warn">
            Diese Fläche enthält bereits verkaufte Pixel. Bitte neu auswählen.
          </p>
        )}

        {!treasuryOk && (
          <p className="banner warn">
            Wallet-Adresse noch nicht gesetzt (
            <code>{TREASURY_WALLET}</code>). Michael muss{' '}
            <code>VITE_TREASURY_WALLET</code> konfigurieren.
          </p>
        )}

        <label className="field">
          <span>Name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Dein Name / Projekt"
          />
        </label>
        <label className="field">
          <span>URL (optional)</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={120}
            placeholder="https://…"
          />
        </label>

        <div className="price-box">
          <div>
            <span className="muted">Preis</span>
            <strong>
              {eur.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR',
              })}
            </strong>
          </div>
          <div>
            <span className="muted">SOL ({SOL_PER_PIXEL} / px)</span>
            <strong>{sol.toFixed(6)} SOL</strong>
          </div>
        </div>

        {error && <p className="banner error">{error}</p>}

        <div className="modal-actions">
          {!connected ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={connecting}
              onClick={() => setVisible(true)}
            >
              {connecting ? 'Verbinde…' : 'Phantom verbinden'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canPay}
              onClick={() => void pay()}
            >
              {busy ? 'Zahlung läuft…' : `Mit Phantom zahlen`}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Abbrechen
          </button>
        </div>
        <p className="muted tiny">
          Die Zahlung geht on-chain an die Treasury. Kaufdaten (Koordinaten,
          Name, URL) stehen im Solana-Memo.
        </p>
      </div>
    </div>
  )
}
