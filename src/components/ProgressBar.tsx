import { TOTAL_PIXELS, EUR_PER_PIXEL } from '../config'

interface Props {
  pixelsSold: number
}

export function ProgressBar({ pixelsSold }: Props) {
  const pct = Math.min(100, (pixelsSold / TOTAL_PIXELS) * 100)
  const eur = pixelsSold * EUR_PER_PIXEL

  return (
    <div className="progress-block">
      <div className="progress-stats">
        <div>
          <span className="stat-value">{pixelsSold.toLocaleString('en-US')}</span>
          <span className="stat-label"> / 1,000,000 pixels</span>
        </div>
        <div>
          <span className="stat-value">
            {eur.toLocaleString('en-US', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="stat-label"> of €1,000,000</span>
        </div>
        <div>
          <span className="stat-value">{pct.toFixed(2)}%</span>
        </div>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${Math.max(pct, pct > 0 ? 0.3 : 0)}%` }} />
      </div>
    </div>
  )
}
