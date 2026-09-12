import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  type ParsedTransactionWithMeta,
} from '@solana/web3.js'
import bs58 from 'bs58'
import { Buffer } from 'buffer'
import {
  TREASURY_WALLET,
  MEMO_PROGRAM_ID,
  SOL_PER_PIXEL,
  isTreasuryConfigured,
} from '../config'
import { encodeMemo, decodeMemo } from './memo'
import { colorFromSeed, DEFAULT_PIXEL_COLOR } from './colors'
import { getConnection, withRpcFallback } from './rpc'
import type { Purchase, Selection } from '../types'

export { getConnection }

export function pixelsInSelection(sel: Selection): number {
  return Math.max(0, sel.w) * Math.max(0, sel.h)
}

export function solForSelection(sel: Selection): number {
  return pixelsInSelection(sel) * SOL_PER_PIXEL
}

export function eurForSelection(sel: Selection): number {
  return pixelsInSelection(sel)
}

export async function buildPurchaseTransaction(
  from: PublicKey,
  sel: Selection,
  name: string,
  url: string,
  color: string = DEFAULT_PIXEL_COLOR,
): Promise<Transaction> {
  if (!isTreasuryConfigured) {
    throw new Error(
      'Treasury wallet is not configured. Set VITE_TREASURY_WALLET.',
    )
  }
  const treasury = new PublicKey(TREASURY_WALLET)
  const lamports = Math.round(solForSelection(sel) * LAMPORTS_PER_SOL)
  if (lamports <= 0) {
    throw new Error('Selection is empty.')
  }

  const memo = encodeMemo(sel, name, url, color)
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: treasury,
      lamports,
    }),
    new TransactionInstruction({
      keys: [{ pubkey: from, isSigner: true, isWritable: false }],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: Buffer.from(memo, 'utf8'),
    }),
  )

  const { blockhash, lastValidBlockHeight } = await withRpcFallback((c) =>
    c.getLatestBlockhash(),
  )
  tx.recentBlockhash = blockhash
  tx.lastValidBlockHeight = lastValidBlockHeight
  tx.feePayer = from
  return tx
}

/**
 * Reconstruct purchases from recent transfers TO the treasury.
 * Cached by the caller; we fetch newest-first and apply oldest-first for ownership.
 */
export async function fetchPurchases(limit = 200): Promise<Purchase[]> {
  if (!isTreasuryConfigured) return []

  const treasury = new PublicKey(TREASURY_WALLET)

  const signatures = await withRpcFallback((c) =>
    c.getSignaturesForAddress(treasury, { limit }),
  )

  const purchases: Purchase[] = []
  const chunkSize = 20

  for (let i = 0; i < signatures.length; i += chunkSize) {
    const chunk = signatures.slice(i, i + chunkSize)
    const txs = await withRpcFallback((c) =>
      c.getParsedTransactions(
        chunk.map((s) => s.signature),
        { maxSupportedTransactionVersion: 0 },
      ),
    )

    for (let j = 0; j < txs.length; j++) {
      const tx = txs[j]
      const sig = chunk[j].signature
      if (!tx || tx.meta?.err) continue

      const memo = extractMemo(tx)
      if (!memo) continue
      const decoded = decodeMemo(memo)
      if (!decoded) continue

      const solAmount = extractSolToTreasury(tx, treasury)
      if (solAmount <= 0) continue

      const buyer =
        tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey.toBase58() ??
        'unknown'

      purchases.push({
        x: decoded.x,
        y: decoded.y,
        w: decoded.w,
        h: decoded.h,
        name: decoded.name,
        url: decoded.url,
        buyer,
        signature: sig,
        solAmount,
        timestamp: (tx.blockTime ?? 0) * 1000,
        color: decoded.color ?? colorFromSeed(sig),
      })
    }
  }

  purchases.sort((a, b) => b.timestamp - a.timestamp)
  return purchases
}

function extractMemo(tx: ParsedTransactionWithMeta): string | null {
  const memoId = MEMO_PROGRAM_ID
  type Ix = {
    programId: PublicKey
    parsed?: unknown
    data?: string
  }

  const top = tx.transaction.message.instructions as Ix[]
  const inner =
    tx.meta?.innerInstructions?.flatMap((i) => i.instructions as Ix[]) ?? []

  for (const ix of [...top, ...inner]) {
    if (ix.programId.toBase58() !== memoId) continue

    const parsed = ix.parsed as
      | { type?: string; info?: string }
      | string
      | undefined
    if (typeof parsed === 'string') return parsed
    if (parsed && typeof parsed === 'object' && typeof parsed.info === 'string') {
      return parsed.info
    }
    if (ix.data) {
      try {
        return Buffer.from(bs58.decode(ix.data)).toString('utf8')
      } catch {
        try {
          return Buffer.from(ix.data, 'base64').toString('utf8')
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function extractSolToTreasury(
  tx: ParsedTransactionWithMeta,
  treasury: PublicKey,
): number {
  if (!tx.meta) return 0
  const keys = tx.transaction.message.accountKeys
  const idx = keys.findIndex((k) => k.pubkey.equals(treasury))
  if (idx < 0) return 0
  const delta = tx.meta.postBalances[idx] - tx.meta.preBalances[idx]
  return delta > 0 ? delta / LAMPORTS_PER_SOL : 0
}
