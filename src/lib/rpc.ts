import { Connection } from '@solana/web3.js'
import { SOLANA_RPC, SOLANA_RPC_ENDPOINTS } from '../config'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function isHardReject(e: unknown): boolean {
  return /403|401|402|415|Access forbidden|API key|not allowed/i.test(
    errorText(e),
  )
}

function isTransientRpcError(e: unknown): boolean {
  return /429|502|503|504|timeout|timed out|fetch|network|ECONN|ENOTFOUND|rate.?limit|too many requests/i.test(
    errorText(e),
  )
}

/**
 * Browser-safe RPC fetch.
 *
 * `@solana/web3.js` adds a `solana-client` header and `Content-Type: application/json`,
 * which forces a CORS preflight. Several free RPCs either omit
 * `Access-Control-Allow-Headers` or block the official Solana host from browsers
 * (HTTP 403 Access forbidden). Sending JSON as `text/plain` without extra headers
 * is a simple request — PublicNode and LeoRPC accept that body and return
 * `Access-Control-Allow-Origin: *`.
 */
export const browserRpcFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers)
  headers.delete('solana-client')
  if (headers.has('content-type')) {
    headers.set('content-type', 'text/plain')
  }
  return fetch(input, { ...init, headers })
}

export function createConnection(endpoint: string): Connection {
  return new Connection(endpoint, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: true,
    fetch: browserRpcFetch,
  })
}

/**
 * Run an RPC call against each public endpoint. Hard rejects (403/401)
 * skip immediately to the next URL; transient errors get a short backoff.
 */
export async function withRpcFallback<T>(
  fn: (connection: Connection) => Promise<T>,
  opts?: { retriesPerEndpoint?: number },
): Promise<T> {
  const retries = opts?.retriesPerEndpoint ?? 2
  let lastError: unknown = new Error('All Solana RPC endpoints failed')

  for (const endpoint of SOLANA_RPC_ENDPOINTS) {
    const connection = createConnection(endpoint)
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn(connection)
      } catch (e) {
        lastError = e
        if (isHardReject(e)) break
        if (attempt < retries - 1 || isTransientRpcError(e)) {
          await sleep(350 * 2 ** attempt + Math.random() * 200)
        }
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Solana RPC temporarily unavailable')
}

export function getConnection(endpoint = SOLANA_RPC): Connection {
  return createConnection(endpoint)
}
