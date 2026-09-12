import { useState } from 'react'

export function ShareButtons() {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : 'https://onemillion.app'
  const text = encodeURIComponent(
    'OneMillion — a social experiment: 1,000,000 pixels at €1 each. Join in!',
  )
  const xUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy link:', url)
    }
  }

  return (
    <div className="share-row">
      <button type="button" className="btn btn-ghost" onClick={() => void copyLink()}>
        {copied ? '✓ Copied' : 'Copy link'}
      </button>
      <a className="btn btn-ghost" href={xUrl} target="_blank" rel="noopener noreferrer">
        Share on X
      </a>
    </div>
  )
}
