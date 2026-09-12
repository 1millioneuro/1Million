export interface Purchase {
  x: number
  y: number
  w: number
  h: number
  name: string
  url: string
  buyer: string
  signature: string
  solAmount: number
  timestamp: number
  color: string
}

export interface Selection {
  x: number
  y: number
  w: number
  h: number
}

export interface HoverInfo {
  x: number
  y: number
  purchase: Purchase | null
}
