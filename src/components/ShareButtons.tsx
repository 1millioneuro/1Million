import { useState } from 'react'

export function ShareButtons() {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : 'https://einemillion.app'
  const text = encodeURIComponent(
    'EineMillion – soziales Experiment: 1.000.000 Pixel à 1 €. Sei dabei!',
  )
  const xUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      prompt('Link kopieren:', url)
    }
  }

  return (
    <div className="share-row">
      <button type="button" className="btn btn-ghost" onClick={() => void copyLink()}>
        {copied ? '✓ Kopiert' : 'Link kopieren'}
      </button>
      <a className="btn btn-ghost" href={xUrl} target="_blank" rel="noopener noreferrer">
        Auf X teilen
      </a>
    </div>
  )
}
