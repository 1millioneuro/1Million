# EineMillion

Soziales Experiment: **1.000.000 Pixel à 1 €** – Ziel **1.000.000 €**.  
Zahlungen über **Phantom (Solana)** an eine öffentliche Treasury-Wallet.  
Reine **Static-Site** (Vite + React + TypeScript) – kein bezahltes Backend, keine Datenbank.

## Features

- Landing mit großem Fortschritt (Pixel, €-Schätzung, %)
- 1000×1000-Grid auf **HTML-Canvas** (Pan/Zoom/Rechteck-Auswahl, keine 1M DOM-Nodes)
- Kauf-Modal: optional Name + URL, €- und SOL-Summe, Phantom Connect + Transfer + **Memo**
- Ownership aus Transfers **an die Treasury** (öffentliche Solana-RPC), In-Memory-Cache
- Teilen: Link kopieren + X-Intent (kein Auto-Posting)
- Dunkles, mobiles UI (Deutsch)

## Setup

```bash
cd einemillion
cp .env.example .env
# .env bearbeiten – siehe unten
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

### Umgebungsvariablen

| Variable | Bedeutung |
|----------|-----------|
| `VITE_TREASURY_WALLET` | Phantom-Empfangsadresse (Base58). Placeholder: `REPLACE_WITH_PHANTOM_ADDRESS` |
| `VITE_SOL_PER_PIXEL` | SOL pro Pixel (Default `0.005`). **Michael setzt den realen €1≈SOL-Kurs** |
| `VITE_SOLANA_RPC` | Optional eigener RPC (sonst `https://api.mainnet-beta.solana.com`) |

**Kurs-Beispiel:** Wenn 1 SOL ≈ 200 €, dann `VITE_SOL_PER_PIXEL=0.005` (≈ 1 €). Vor Launch den aktuellen EUR/SOL-Kurs prüfen und anpassen.

## Deploy (kostenlos)

### Cloudflare Pages

1. Repo verbinden oder `dist/` hochladen  
2. Build-Command: `npm run build`  
3. Output-Directory: `dist`  
4. Environment Variables in Pages setzen (`VITE_TREASURY_WALLET`, `VITE_SOL_PER_PIXEL`)  
5. Deploy

### GitHub Pages

1. `base: './'` ist in `vite.config.ts` gesetzt (relative Pfade)  
2. Actions oder manuell: `npm run build` → Inhalt von `dist/` in `gh-pages` Branch  
3. Oder: Settings → Pages → Deploy from GitHub Actions  

Beispiel Workflow-Idee: Node 20, `npm ci && npm run build`, Artifact `dist`.

## On-Chain-Kauf (Memo)

Memo-Format: `EM1:x,y,w,h|name|url`  
Program: Solana Memo (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXkDLWxDzu`)  
Zusätzlich: SOL-Transfer an die Treasury.

Ownership: chronologisch **First-Wins** (ältere gültige Memos behalten Pixel).

## Limitierungen (Free-RPC)

- Öffentliche Solana-RPCs **rate-limitieren** stark → Käufe/History können zeitweise fehlschlagen  
- Nur die letzten ~N Signatures werden geladen (kein vollständiger Index ohne Indexer)  
- Kein Server = kein persistenter Cache über Sessions hinweg (nur In-Memory im Tab)  
- Für Produktion: kostenlosen Helius-/QuickNode-Endpoint in `VITE_SOLANA_RPC` setzen  

## Wichtig vor Go-Live

1. Echte Phantom-Adresse in `VITE_TREASURY_WALLET`  
2. Realen SOL/EUR-Kurs in `VITE_SOL_PER_PIXEL`  
3. Optional eigenen RPC setzen  
4. Rechtliches/Transparenzhinweise prüfen (soziales Experiment, keine Anlageberatung)

## Lizenz / Hinweis

Hobby-/Experiment-Projekt. Zahlungen sind finale On-Chain-Transfers.
