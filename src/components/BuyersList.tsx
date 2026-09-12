import type { Purchase } from '../types'

interface Props {
  purchases: Purchase[]
  loading: boolean
}

export function BuyersList({ purchases, loading }: Props) {
  const recent = purchases.slice(0, 12)

  return (
    <section className="buyers panel">
      <h2>Recent buyers</h2>
      {loading && <p className="muted">Loading on-chain data…</p>}
      {!loading && recent.length === 0 && (
        <p className="muted">No purchases yet — be the first!</p>
      )}
      <ul className="buyers-list">
        {recent.map((p) => (
          <li key={p.signature}>
            <span className="buyer-swatch" style={{ background: p.color }} />
            <div className="buyer-meta">
              <strong>
                {p.name || shortAddr(p.buyer)}{' '}
                <span className="muted">
                  {p.w}×{p.h} ({p.w * p.h} px)
                </span>
              </strong>
              <a
                href={`https://solscan.io/tx/${p.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="muted link"
              >
                Solscan ↗
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function shortAddr(a: string) {
  if (a.length < 10) return a
  return `${a.slice(0, 4)}…${a.slice(-4)}`
}
