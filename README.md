# OneMillion (EineMillion)

Social experiment: **1,000,000 pixels at €1** — goal **€1,000,000**.  
Payments via **Phantom (Solana)** to a public treasury wallet.  
Pure **static site** (Vite + React + TypeScript) — no paid backend, no database.

## Features

- Landing with a large progress bar (pixels, € estimate, %)
- 1000×1000 grid on an **HTML canvas** (pan/zoom/rectangle select, no 1M DOM nodes)
- Buy modal: color picker, optional name + URL, € and SOL totals, Phantom connect + transfer + **Memo**
- Ownership reconstructed from transfers **to the treasury** (public Solana RPCs with fallback + retry)
- Share: copy link + X intent (no auto-posting)
- Dark, mobile UI (English)

## Setup

```bash
cd einemillion
cp .env.example .env
# edit .env — see below
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

Production builds (`vite build`) automatically load `.env.production`.

### Environment variables

| Variable | Meaning |
|----------|---------|
| `VITE_TREASURY_WALLET` | Phantom receive address (Base58). Placeholder: `REPLACE_WITH_PHANTOM_ADDRESS` |
| `VITE_SOL_PER_PIXEL` | SOL per pixel (Default `0.005`). Set the live €1≈SOL rate before launch |
| `VITE_SOLANA_RPC` | Optional custom RPC (otherwise public fallbacks, starting with PublicNode) |

**Rate example:** If 1 SOL ≈ 87 €, then `VITE_SOL_PER_PIXEL=0.0115` (≈ €1). Recheck EUR/SOL before launch.

## Deploy (free)

### Cloudflare Pages

1. Connect the repo or upload `dist/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables (`VITE_TREASURY_WALLET`, `VITE_SOL_PER_PIXEL`)
5. Deploy

### GitHub Pages

1. `base: '/1Million/'` is set in `vite.config.ts`
2. The `Deploy GitHub Pages` workflow runs `npm ci && npm run build` on `main` (production mode, so `.env.production` is baked in)
3. Or: Settings → Pages → Deploy from GitHub Actions

## On-chain purchase (Memo)

Program: Solana Memo (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXkDLWxDzu`).  
Plus a SOL transfer to the treasury.

Memo format:

- **Current:** `EM1:x,y,w,h|#RRGGBB|name|url`
- **Legacy (still parsed):** `EM1:x,y,w,h|name|url`

Color is one hex value for the whole purchased rectangle (`#RGB` or `#RRGGBB`).  
If a memo has no color field, the canvas falls back to a hash color from the transaction signature.

Ownership: chronological **first-wins** (older valid memos keep their pixels).

## Limitations (free RPC)

- Public Solana RPCs **rate-limit** — the UI soft-fails (muted notice + quiet retry / endpoint fallback) instead of blocking the page
- Only the last ~N signatures are loaded (no full index without an indexer)
- No server = no persistent cache across sessions (in-memory in the tab only)
- For production volume: put a free Helius/QuickNode URL in `VITE_SOLANA_RPC`

## Before go-live

1. Real Phantom address in `VITE_TREASURY_WALLET`
2. Real SOL/EUR rate in `VITE_SOL_PER_PIXEL`
3. Optional dedicated RPC
4. Review legal / transparency copy (social experiment, not investment advice)

## License / note

Hobby / experiment project. Payments are final on-chain transfers.
