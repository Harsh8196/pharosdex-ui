import { useState, useEffect } from 'react'
import { createPublicClient, formatUnits, http, PublicClient } from 'viem'
import VelocoreLensABI from '@/lib/contracts/abis/VelocoreLens.json'
import IVaultABI from '@/lib/contracts/abis/IVault.json'
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses'
import { PHAROS_CHAIN } from '@/lib/constants/chains'
import { GaugeData } from '@/lib/types/contracts'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { SUPPORTED_TOKENS } from '@/lib/constants/tokens'

const POOLS_PER_PAGE = 10
const SECONDS_IN_YEAR = 31536000 // 365 * 24 * 60 * 60

interface PoolDisplayData {
  id: number;
  address: string;
  token0: {
    symbol: string;
    name: string;
    logoURI?: string;
    address: string;
    decimals: number;
  };
  token1: {
    symbol: string;
    name: string;
    logoURI?: string;
    address: string;
    decimals: number;
  };
  tvl: string;
  poolamountToken0: string;
  poolamountToken1: string;
  apr: string;
  volume24h: string;
  fees24h: string;
  version: string;
  swapFee: string;
  stakedLp: string;
  userVotes: bigint;
}

function extractTokenAddress(poolAddress: string): string {
  // Extract last 20 bytes and add 0x prefix
  console.log('poolAddress', poolAddress)
  console.log('poolAddress.slice(-40)', `0x${poolAddress.slice(-40)}`)
  return `0x${poolAddress.slice(-40)}`
}

function findTokenByAddress(address: string) {
  return SUPPORTED_TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase())
}

function calculateYearlyAPR(aprPerSecond: bigint): string {
  // Convert to yearly APR: (1 + aprPerSecond)^secondsInYear - 1
  const aprPerSecondNum = Number(aprPerSecond) / 1e18 // Convert from wei
  const yearlyAPR = (Math.pow(1 + aprPerSecondNum, SECONDS_IN_YEAR) - 1) * 100
  return `${yearlyAPR.toFixed(2)}%`
}

function decodePoolParams(poolParams: string): { fee: number } {
  try {
    // Remove 0x prefix if present
    const hexString = poolParams.startsWith('0x') ? poolParams.slice(2) : poolParams;
    
    // The first 64 characters (32 bytes) represent the fee
    const feeHex = hexString.slice(0, 64);
    // Convert from wei (1e18) to percentage
    const fee = (parseInt(feeHex, 16) / 1e18) * 100;
    
    return { fee };
  } catch (error) {
    console.error('Error decoding pool params:', error);
    return { fee: 0 };
  }
}

export function usePoolData() {
  const [pools, setPools] = useState<PoolDisplayData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<PublicClient | null>(null)
  const { address } = useWalletStore()

  // Initialize viem client
  useEffect(() => {
    const client = createPublicClient({
      chain: PHAROS_CHAIN,
      transport: http()
    })
    setClient(client)
  }, [])

  const fetchPools = async () => {
    if (!client || !address) return

    setLoading(true)
    try {
      // Get total number of pools from IVault
      const totalPairs = await client.readContract({
        address: CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`,
        abi: IVaultABI,
        functionName: 'allPairsLength',
      }) as bigint
      

      // Fetch all pool addresses using allPairs
      const poolAddresses: string[] = []
      for (let i = 0; i < Number(totalPairs); i++) {
        try {
          const poolAddress = await client.readContract({
            address: CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`,
            abi: IVaultABI,
            functionName: 'allPairs',
            args: [BigInt(i)]
          }) as string
          poolAddresses.push(poolAddress)
        } catch (err) {
          console.error(`Error fetching pool address at index ${i}:`, err)
          continue
        }
      }
      console.log('poolAddresses', poolAddresses)

      // Get pool data for each address using VelocoreLens
      const poolsData: PoolDisplayData[] = []
      for (let i = 0; i < poolAddresses.length; i += POOLS_PER_PAGE) {
        const batchAddresses = poolAddresses.slice(i, i + POOLS_PER_PAGE)
        
        try {
          // Get pool data for current batch
          console.log('User Address', address)
          const batchPoolsData = await client.simulateContract({
            address: CONTRACT_ADDRESSES.mainnet.VelocoreLens as `0x${string}`,
            abi: VelocoreLensABI,
            functionName: 'canonicalPools',
            args: [address, BigInt(i), BigInt(batchAddresses.length)],
            account: address as `0x${string}`
          }).then(result => result.result) as GaugeData[]

          console.log('Gauge Data Debug:', batchPoolsData.map(pool => ({
            gauge: pool.gauge,
            killed: pool.killed,
            totalVotes: pool.totalVotes.toString(),
            emissionRate: pool.emissionRate.toString(),
            stakedValueInHubToken: pool.stakedValueInHubToken.toString(),
            averageInterestRatePerSecond: pool.averageInterestRatePerSecond.toString()
          })))

          if (batchPoolsData) {
            const formattedPools = batchPoolsData.map((poolData, index) => {
              // Extract token addresses and find token info
              const token0Address = extractTokenAddress(poolData.poolData.listedTokens[0].toString())
              const token1Address = extractTokenAddress(poolData.poolData.listedTokens[1].toString())
              const token0 = findTokenByAddress(token0Address)
              const token1 = findTokenByAddress(token1Address)

              return {
                id: i + index,
                address: poolData.poolData.pool,
                token0: {
                  symbol: token0?.symbol || 'Unknown',
                  name: token0?.name || 'Unknown Token',
                  logoURI: token0?.logoURI,
                  address: token0Address,
                  decimals: token0?.decimals || 18
                },
                token1: {
                  symbol: token1?.symbol || 'Unknown',
                  name: token1?.name || 'Unknown Token',
                  logoURI: token1?.logoURI,
                  address: token1Address,
                  decimals: token1?.decimals || 18
                },
                tvl: formatUSD(poolData.stakedValueInHubToken),
                poolamountToken0: parseFloat(formatUnits(poolData.poolData.reserves[0] || BigInt(0), token0?.decimals || 18)).toFixed(2),
                poolamountToken1: parseFloat(formatUnits(poolData.poolData.reserves[1] || BigInt(0), token1?.decimals || 18)).toFixed(2),
                apr: calculateYearlyAPR(poolData.averageInterestRatePerSecond),
                volume24h: formatUSD(poolData.poolData.reserves[0] || BigInt(0)),
                fees24h: formatUSD(poolData.userClaimable),
                version: poolData.poolData.poolType,
                swapFee: decodePoolParams(poolData.poolData.poolParams).fee.toFixed(2),
                stakedLp: poolData.userStakedAmounts && poolData.userStakedAmounts.length > 0 ? formatUnits(poolData.userStakedAmounts[0], 18) : '0',
                userVotes: poolData.userVotes,
              }
            })

            poolsData.push(...formattedPools)
          }
        } catch (batchError) {
          console.error(`Error fetching batch starting at index ${i}:`, batchError)
          continue
        }
      }

      setPools(poolsData)
      setError(null)
    } catch (err) {
      console.error('Error fetching pool data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pool data')
      setPools([])
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPools()
  }, [client, address])

  return { pools, loading, error, refreshPools: fetchPools }
}

// Helper functions
function formatUSD(value: bigint): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value))
} 