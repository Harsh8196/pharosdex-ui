export interface GaugeData {
  gauge: `0x${string}`
  pool: `0x${string}`
  token0Symbol: string
  token0Name: string
  token0LogoURI?: string
  token1Symbol: string
  token1Name: string
  token1LogoURI?: string
  tvl: bigint
  apr: bigint
  volume24h: bigint
  fees24h: bigint
}

export interface PoolData {
  id: number
  address: string
  token0: {
    symbol: string
    name: string
    logoURI?: string
  }
  token1: {
    symbol: string
    name: string
    logoURI?: string
  }
  tvl: string
  apr: string
  volume24h: string
  fees24h: string
  version: string
} 