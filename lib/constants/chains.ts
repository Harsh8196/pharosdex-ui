import { Chain } from "viem"

// Actual RPC URL
export const RPC_URL ='https://devnet.dplabs-internal.com'

export const PHAROS_CHAIN: Chain = {
  id: 50002,
  name: 'Pharos Devnet Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Pharos',
    symbol: 'PTT',
  },
  rpcUrls: {
    default: { http: ['/api/rpc'] },
    public: { http: ['/api/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Pharos Explorer', url: 'https://pharosscan.xyz' },
  },
}

// Add more chains as needed
export const SUPPORTED_CHAINS: Chain[] = [
  PHAROS_CHAIN,
  // Add other chains here
] 