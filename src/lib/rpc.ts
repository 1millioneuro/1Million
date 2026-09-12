import { Connection } from '@solana/web3.js'
import { SOLANA_RPC_ENDPOINTS } from '../config'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientRpcError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return /429|403|502|503|504|timeout|timed out|fetch|network|ECONN|ENOTFOUND|rate.?limit|too many requests|503 Service|502 Bad/i.test(
    msg,
  )
}

/**
 * Run an RPC call against each public endpoint, with short exponential
 * backoff per attempt. First success wins; last error is thrown.
 */
export async function withRpcFallback<T>(
  fn: (connection: Connection) => Promise<T>,
  opts?: { retriesPerEndpoint?: number },
): Promise<T> {
  const retries = opts?.retriesPerEndpoint ?? 2
  let lastError: unknown = new Error('All Solana RPC endpoints failed')

  for (const endpoint of SOLANA_RPC_ENDPOINTS) {
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
    })
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn(connection)
      } catch (e) {
        lastError = e
        const backoff = 350 * 2 ** attempt + Math.random() * 200
        if (attempt < retries - 1 || isTransientRpcError(e)) {
          await sleep(backoff)
        }
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Solana RPC temporarily unavailable')
}

export function getConnection(endpoint = SOLANA_RPC_ENDPOINTS[0]): Connection {
  return new Connection(endpoint, 'confirmed')
}
