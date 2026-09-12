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
import { DEFAULT_PIXEL_COLOR, normalizeHexColor } from '../lib/colors'
import type { Selection } from '../types'

interface Props {
  selection: Selection
  hasOwned: boolean
  onClose: () => void
  onSuccess: (signature: string) => void
}

function toColorInputValue(hex: string): string {
  return hex.toLowerCase()
}

export function BuyModal({ selection, hasOwned, onClose, onSuccess }: Props) {
  const { publicKey, sendTransaction, connected, connecting } = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [color, setColor] = useState(DEFAULT_PIXEL_COLOR)
  const [hexDraft, setHexDraft] = useState(DEFAULT_PIXEL_COLOR)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pixels = pixelsInSelection(selection)
  const eur = eurForSelection(selection)
  const sol = solForSelection(selection)

  const treasuryOk = isTreasuryConfigured

  const canPay = useMemo(
    () =>
      treasuryOk &&
      connected &&
      !hasOwned &&
      pixels > 0 &&
      !busy &&
      !!normalizeHexColor(color),
    [treasuryOk, connected, hasOwned, pixels, busy, color],
  )

  function applyColor(next: string) {
    const normalized = normalizeHexColor(next)
    if (normalized) {
      setColor(normalized)
      setHexDraft(normalized)
    } else {
      setHexDraft(next)
    }
  }

  async function pay() {
    setError(null)
    if (!treasuryOk) {
      setError(
        'Treasury wallet is missing. Set VITE_TREASURY_WALLET to your Phantom address.',
      )
      return
    }
    if (!publicKey) {
      setVisible(true)
      return
    }
    if (hasOwned) {
      setError('This selection includes pixels that are already sold.')
      return
    }
    const hex = normalizeHexColor(color)
    if (!hex) {
      setError('Pick a valid hex color (e.g. #58A6FF).')
      return
    }
    setBusy(true)
    try {
      const tx = await buildPurchaseTransaction(
        publicKey,
        selection,
        name,
        url,
        hex,
      )
      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')
      onSuccess(sig)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transaction failed'
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
          <h2 id="buy-title">Buy pixels</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <p className="modal-sel">
          Selection:{' '}
          <strong>
            ({selection.x}, {selection.y}) · {selection.w}×{selection.h}
          </strong>{' '}
          = <strong>{pixels.toLocaleString('en-US')} pixels</strong>
        </p>

        {hasOwned && (
          <p className="banner warn">
            This area already has sold pixels. Please select a free rectangle.
          </p>
        )}

        {!treasuryOk && (
          <p className="banner warn">
            Wallet address is not set yet (
            <code>{TREASURY_WALLET}</code>). Configure{' '}
            <code>VITE_TREASURY_WALLET</code> before purchases can go live.
          </p>
        )}

        <label className="field">
          <span>Pixel color</span>
          <div className="color-row">
            <input
              type="color"
              value={toColorInputValue(color)}
              onChange={(e) => applyColor(e.target.value)}
              aria-label="Color picker"
            />
            <input
              value={hexDraft}
              onChange={(e) => applyColor(e.target.value)}
              onBlur={() => {
                const normalized = normalizeHexColor(hexDraft)
                if (normalized) {
                  setColor(normalized)
                  setHexDraft(normalized)
                } else {
                  setHexDraft(color)
                }
              }}
              maxLength={7}
              spellCheck={false}
              placeholder="#58A6FF"
              aria-label="Hex color"
            />
            <span
              className="color-swatch"
              style={{ background: color }}
              title={`${selection.w}×${selection.h} at ${color}`}
            />
          </div>
          <span className="tiny">
            The same color is applied to every pixel in this purchase so
            neighboring buys can form images.
          </span>
        </label>

        <label className="field">
          <span>Name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Your name / project"
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
            <span className="muted">Price</span>
            <strong>
              {eur.toLocaleString('en-US', {
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
              {connecting ? 'Connecting…' : 'Connect Phantom'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canPay}
              onClick={() => void pay()}
            >
              {busy ? 'Paying…' : 'Pay with Phantom'}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
        <p className="muted tiny">
          Payment goes on-chain to the treasury. Purchase data (coordinates,
          color, name, URL) is stored in the Solana memo.
        </p>
      </div>
    </div>
  )
}
