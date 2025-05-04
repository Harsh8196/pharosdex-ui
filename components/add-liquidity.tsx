"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, X, Settings, ChevronDown } from "lucide-react"
import { SUPPORTED_TOKENS } from "@/lib/constants/tokens"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { usePoolData } from "@/hooks/usePoolData"
import { useWalletStore } from "@/lib/stores/wallet-store"
import { formatUnits, parseUnits, createWalletClient, createPublicClient, http, custom } from "viem"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses'
import IVaultABI from '@/lib/contracts/abis/IVault.json'
import { PHAROS_CHAIN } from '@/lib/constants/chains'
import { toast, Toaster } from "@/components/ui/use-toast"
import ERC20ABI from '@/lib/contracts/abis/ERC20.json'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { getAdjustedGasEstimate } from '@/lib/contracts/contractUtils'


const GAUGE = 1;
const EXACTLY = 0;
const AT_MOST = 1;

// Helper: encode address as bytes32 (Token)
function toToken(address: string): `0x${string}` {
  return `0x${address.replace(/^0x/, '').padStart(64, '0')}` as `0x${string}`;
}

// Helper: get PHAS token
function getPhasToken() {
  const token = SUPPORTED_TOKENS.find(token => token.symbol === 'PHAS');
  if (!token) throw new Error('PHAS token not found');
  return token;
}

// Helper: encode poolId (opType + pool address)
function toPoolId(opType: number, pool: string): `0x${string}` {
  return `0x${opType.toString(16).padStart(2, '0')}${'0'.repeat(22)}${pool.replace(/^0x/, '')}` as `0x${string}`;
}
// Helper: encode tokenInfo (index, method, amount)
function toTokenInfo(index: number, method: number, amount: bigint): `0x${string}` {
  const indexHex = index.toString(16).padStart(2, '0');
  const methodHex = method.toString(16).padStart(2, '0');
  const zeros = '0'.repeat(28);
  let amountHex = (amount >= 0n ? amount : (1n << 128n) + amount).toString(16).padStart(32, '0');
  return `0x${indexHex}${methodHex}${zeros}${amountHex}` as `0x${string}`;
}

export default function AddLiquidity() {
  const { pools, loading: poolsLoading, error, refreshPools } = usePoolData()
  const [selectedPool, setSelectedPool] = useState<typeof pools[0] | null>(null)
  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false)
  const [lpAmount, setLpAmount] = useState("")
  const [manageLpAmount, setManageLpAmount] = useState("")
  const [lpInputError, setLpInputError] = useState<string>("")
  const [showManageLpDialog, setShowManageLpDialog] = useState(false)
  const [lpTxStatus, setLpTxStatus] = useState<string>("")
  const [lpTxError, setLpTxError] = useState<string>("")
  const { 
    address, 
    isConnected, 
    tokenBalances,
    updateAllBalances,
    fetchTokenBalance,
    connectWallet,
    walletClient
  } = useWalletStore()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [slippageDeposit, setSlippageDeposit] = useState("1")
  const [slippageWithdraw, setSlippageWithdraw] = useState("1")
  const [quoteAmounts, setQuoteAmounts] = useState<{ amount0: string; amount1: string } | null>(null)
  const [lpBalance, setLpBalance] = useState<string>("0")
  const publicClient = createPublicClient({
    chain: PHAROS_CHAIN,
    transport: http()
  })

  useEffect(() => {
    if(!walletClient?.account){
      connectWallet()
    }
  }, [walletClient])

  // Auto-select first pool when data is loaded
  useEffect(() => {
    if (pools.length > 0 && !selectedPool) {
      setSelectedPool(pools[0])
    }
  }, [pools, selectedPool])

  // Update balances when pool is selected or address changes
  useEffect(() => {
    if (isConnected && selectedPool) {
      updateAllBalances()
      fetchLpBalance()
    }
  }, [isConnected, selectedPool, address])

  // Effect to update selected pool when pools data changes
  useEffect(() => {
    if (selectedPool && pools.length > 0) {
      const updatedPool = pools.find(p => p.id === selectedPool.id)
      if (updatedPool) {
        setSelectedPool(updatedPool)
      }
    }
  }, [pools])

  // Get token balances
  const getTokenBalance = async (token: typeof SUPPORTED_TOKENS[0]) => {
    if (!isConnected || !token) return "0"
    try {
      const balance = await fetchTokenBalance(token)
      return balance
    } catch (error) {
      console.error("Error fetching balance:", error)
      return "0"
    }
  }

  // Handle percentage clicks
  const handlePercentageClick = async (percentage: number, tokenIndex: number) => {
    if (!selectedPool) return
    
    const token = tokenIndex === 0 ? selectedPool.token0 : selectedPool.token1
    const balance = await getTokenBalance(token)
    
    if (balance) {
      const maxAmount = parseFloat(balance)
      const amount = (maxAmount * percentage / 100).toFixed(6)
      if (tokenIndex === 0) {
        setAmount0(amount)
      } else {
        setAmount1(amount)
      }
    }
  }

  const resetForm = () => {
    setAmount0("")
    setAmount1("")
  }

  // Add function to fetch LP balance using viem
  const fetchLpBalance = async () => {
    if (!selectedPool || !address) {
      setLpBalance("0")
      return
    }

    try {
      const balance = await publicClient.readContract({
        address: selectedPool.address as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }) as bigint

      setLpBalance(formatUnits(balance, 18)) // LP tokens are always 18 decimals
    } catch (error) {
      console.error('Error fetching LP balance:', error)
      setLpBalance("0")
    }
  }

  const handleAddLiquidity = async () => {
    if (!selectedPool || !address || !amount0 || !amount1) {
      console.log('Missing required data:', { selectedPool, address, amount0, amount1 })
      return
    }

    setIsAddingLiquidity(true)
    try {
      // Convert amounts to wei
      const amount0Wei = parseUnits(amount0, selectedPool.token0.decimals)
      const amount1Wei = parseUnits(amount1, selectedPool.token1.decimals)

      // Calculate minimum amounts with slippage
      const slippage = parseFloat(slippageDeposit) / 100
      const amount0Min = amount0Wei * BigInt(Math.floor((1 - slippage) * 1e18)) / BigInt(1e18)
      const amount1Min = amount1Wei * BigInt(Math.floor((1 - slippage) * 1e18)) / BigInt(1e18)

      // Check if either token is native token (ETH)
      const isToken0Native = selectedPool.token0.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
      const isToken1Native = selectedPool.token1.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()

      let hash: `0x${string}`
      if (isToken0Native || isToken1Native) {
        // Handle native token case
        const token = isToken0Native ? selectedPool.token1 : selectedPool.token0
        const amountToken = isToken0Native ? amount1Wei : amount0Wei
        const amountETH = isToken0Native ? amount0Wei : amount1Wei
        const amountTokenMin = isToken0Native ? amount1Min : amount0Min
        const amountETHMin = isToken0Native ? amount0Min : amount1Min

        const addLiquidityParams = {
          address: `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`,
          abi: IVaultABI,
          account: address as `0x${string}`,
          functionName: 'addLiquidityETH',
          args: [
            token.address,
            false, // stable
            amountToken,
            amountTokenMin,
            amountETHMin,
            address,
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // deadline
          ],
          value: amountETH,
          chain: PHAROS_CHAIN,
        }
        const gas = await getAdjustedGasEstimate(publicClient, walletClient, addLiquidityParams)
        hash = await walletClient.writeContract({
          ...addLiquidityParams,
          gas
        })
      } else {
        // Handle non-native token case
        const addLiquidityParams = {
          address: `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`,
          abi: IVaultABI,
          account: address as `0x${string}`,
          functionName: 'addLiquidity',
          args: [
            selectedPool.token0.address,
            selectedPool.token1.address,
            false, // stable
            amount0Wei,
            amount1Wei,
            amount0Min,
            amount1Min,
            address,
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // deadline
          ],
          chain: PHAROS_CHAIN,
        }
        const gas = await getAdjustedGasEstimate(publicClient, walletClient, addLiquidityParams)
        hash = await walletClient.writeContract({
          ...addLiquidityParams,
          gas
        })
      }

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction receipt:', receipt)

      // Reset form first for immediate feedback
      resetForm()

      // Show success toast
      toast({
        title: "Liquidity Added Successfully",
        description: `Added liquidity to ${selectedPool.token0.symbol}/${selectedPool.token1.symbol} pool`,
        variant: "default",
      })

      // Wait a bit for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update token balances
      await Promise.all([
        fetchTokenBalance(selectedPool.token0),
        fetchTokenBalance(selectedPool.token1),
        updateAllBalances(),
        fetchLpBalance()
      ])

      // Refresh pool data
      await refreshPools()

      // Update selected pool data
      const updatedPool = pools.find(p => p.id === selectedPool.id)
      if (updatedPool) {
        setSelectedPool(updatedPool)
      }

    } catch (error) {
      console.error('Error adding liquidity:', error)
      toast({
        title: "Error Adding Liquidity",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  // Add a function to get quote for remove liquidity
  const getRemoveLiquidityQuote = async (lpAmountInput: string) => {
    if (!selectedPool || !lpAmountInput) {
      setQuoteAmounts(null)
      return
    }

    try {
      // Check if either token is native token (ETH)
      const isToken0Native = selectedPool.token0.address.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
      const isToken1Native = selectedPool.token1.address.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()

      let tokenA = selectedPool.token0.address
      let tokenB = selectedPool.token1.address

      // If either token is native ETH, use address(0)
      if (isToken0Native) tokenA = '0x0000000000000000000000000000000000000000'
      if (isToken1Native) tokenB = '0x0000000000000000000000000000000000000000'

      const quote = await publicClient.readContract({
        address: `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`,
        abi: IVaultABI,
        functionName: 'quoteRemoveLiquidity',
        args: [
          tokenA,
          tokenB,
          false, // stable
          parseUnits(lpAmountInput, 18) // LP tokens are always 18 decimals
        ]
      }) as [bigint, bigint]

      setQuoteAmounts({
        amount0: formatUnits(quote[0], selectedPool.token0.decimals),
        amount1: formatUnits(quote[1], selectedPool.token1.decimals)
      })

      return quote
    } catch (error) {
      console.error('Error getting remove liquidity quote:', error)
      setQuoteAmounts(null)
      return null
    }
  }

  // Update handleLpAmountChange to only affect remove liquidity
  const handleLpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLpAmount(value)
    
    // Validate input
    if (value) {
      const inputAmount = parseFloat(value)
      const maxBalance = parseFloat(lpBalance)
      
      if (inputAmount > maxBalance) {
        setLpInputError("Insufficient LP token balance")
      } else {
        setLpInputError("")
        getRemoveLiquidityQuote(value)
      }
    } else {
      setLpInputError("")
      setQuoteAmounts(null)
    }
  }

  // Add new handler for manage LP amount
  const handleManageLpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManageLpAmount(value)
  }

  // Update handleLpPercentageClick to only affect remove liquidity
  const handleLpPercentageClick = (percentage: number) => {
    if (!lpBalance) return
    
    const amount = (parseFloat(lpBalance) * percentage / 100).toString()
    setLpAmount(amount)
    setLpInputError("") // Clear any error since percentage is always valid
    getRemoveLiquidityQuote(amount)
  }

  // Add new handler for manage LP percentage
  const handleManageLpPercentageClick = (percentage: number) => {
    if (!lpBalance) return
    
    const amount = (parseFloat(lpBalance) * percentage / 100).toString()
    setManageLpAmount(amount)
  }

  const handleRemoveLiquidity = async () => {
    if (!selectedPool || !address || !lpAmount) {
      console.log('Missing required data:', { selectedPool, address, lpAmount })
      return
    }

    // Validate amount before proceeding
    const inputAmount = parseFloat(lpAmount)
    const maxBalance = parseFloat(lpBalance)
    if (inputAmount > maxBalance) {
      setLpInputError("Insufficient LP token balance")
      return
    }

    setIsRemovingLiquidity(true)
    try {
      // Get quote for removing liquidity
      const quote = await getRemoveLiquidityQuote(lpAmount)
      if (!quote) {
        throw new Error('Failed to get quote for remove liquidity')
      }

      // Calculate minimum amounts with slippage
      const slippage = parseFloat(slippageWithdraw) / 100
      const amount0Min = quote[0] * BigInt(Math.floor((1 - slippage) * 1e18)) / BigInt(1e18)
      const amount1Min = quote[1] * BigInt(Math.floor((1 - slippage) * 1e18)) / BigInt(1e18)

      // Check if either token is native token (ETH)
      const isToken0Native = selectedPool.token0.address.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
      const isToken1Native = selectedPool.token1.address.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()

      let hash: `0x${string}`
      if (isToken0Native || isToken1Native) {
        // Handle native token case
        const token = isToken0Native ? selectedPool.token1 : selectedPool.token0
        const amountTokenMin = isToken0Native ? amount1Min : amount0Min
        const amountETHMin = isToken0Native ? amount0Min : amount1Min

        const removeLiquidityParams = {
          address: `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`,
          abi: IVaultABI,
          account: address as `0x${string}`,
          functionName: 'removeLiquidityETH',
          args: [
            token.address,
            false, // stable
            parseUnits(lpAmount, 18),
            amountTokenMin,
            amountETHMin,
            address,
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // deadline
          ],
          chain: PHAROS_CHAIN,
        }
        const gas = await getAdjustedGasEstimate(publicClient, walletClient, removeLiquidityParams)
        hash = await walletClient.writeContract({
          ...removeLiquidityParams,
          gas
        })
      } else {
        // Handle non-native token case
        const removeLiquidityParams = {
          address: `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`,
          abi: IVaultABI,
          account: address as `0x${string}`,
          functionName: 'removeLiquidity',
          args: [
            selectedPool.token0.address,
            selectedPool.token1.address,
            false, // stable
            parseUnits(lpAmount, 18),
            amount0Min,
            amount1Min,
            address,
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // deadline
          ],
          chain: PHAROS_CHAIN,
        }
        const gas = await getAdjustedGasEstimate(publicClient, walletClient, removeLiquidityParams)
        hash = await walletClient.writeContract({
          ...removeLiquidityParams,
          gas
        })
      }

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction receipt:', receipt)

      // Reset form first for immediate feedback
      setLpAmount("")
      setQuoteAmounts(null)

      // Show success toast
      toast({
        title: "Liquidity Removed Successfully",
        description: `Removed liquidity from ${selectedPool.token0.symbol}/${selectedPool.token1.symbol} pool`,
        variant: "default",
      })

      // Wait a bit for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update token balances
      await Promise.all([
        fetchTokenBalance(selectedPool.token0),
        fetchTokenBalance(selectedPool.token1),
        updateAllBalances(),
        fetchLpBalance()
      ])

      // Refresh pool data
      await refreshPools()

      // Update selected pool data
      const updatedPool = pools.find(p => p.id === selectedPool.id)
      if (updatedPool) {
        setSelectedPool(updatedPool)
      }

    } catch (error) {
      console.error('Error removing liquidity:', error)
      toast({
        title: "Error Removing Liquidity",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsRemovingLiquidity(false)
    }
  }

  // Update the button click handler to use the correct function based on activeTab
  const handleAction = async () => {
    if (activeTab === 'deposit') {
      await handleAddLiquidity()
    } else {
      await handleRemoveLiquidity()
    }
  }

  // Handle LP staking
  const handleStakeLp = async () => {
    if (!selectedPool || !address || !manageLpAmount) return
    setLpTxError("")
    setLpTxStatus("Checking allowance...")
    try {
      setIsAddingLiquidity(true)
      const lpTokenAddress = selectedPool.address as `0x${string}`
      const vaultAddress = `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`
      const amountToStake = parseUnits(manageLpAmount, 18)

      // 1. Approve Vault to spend LP token (if not already approved)
      const allowance = await publicClient.readContract({
        address: lpTokenAddress,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, vaultAddress]
      }) as bigint
      if (allowance < amountToStake) {
        setLpTxStatus("Approving LP token...")
        const approveParams = {
          address: lpTokenAddress,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [vaultAddress, amountToStake],
          account: walletClient.account
        }
        const approveGas = await getAdjustedGasEstimate(publicClient, walletClient, approveParams)
        const approveHash = await walletClient.writeContract({
          ...approveParams,
          gas: approveGas,
        })
        setLpTxStatus("Waiting for approval confirmation...")
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      // 2. Prepare tokens array
      const tokens = [
        toToken(lpTokenAddress),
        toToken(getPhasToken().address),
      ]
      // 3. Prepare deposit array (int128[])
      const deposits = [amountToStake, 0n]
      // 4. Prepare ops array
      const poolId = toPoolId(GAUGE, lpTokenAddress)
      const tokenInformations = [
        toTokenInfo(0, EXACTLY, amountToStake), // stake LP
        toTokenInfo(1, AT_MOST, 0n),           // harvest VC
      ]
      const ops = [{
        poolId,
        tokenInformations,
        data: '0x',
      }]
      // 5. Call execute
      setLpTxStatus("Staking LP...")
      const executeParams = {
        address: vaultAddress,
        abi: IVaultABI,
        functionName: 'execute',
        args: [tokens, deposits, ops],
        account: walletClient.account
      }
      const executeGas = await getAdjustedGasEstimate(publicClient, walletClient, executeParams)
      const hash = await walletClient.writeContract({
        ...executeParams,
        gas: executeGas,
      })
      setLpTxStatus("Waiting for confirmation...")
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction receipt:', receipt)
      toast({ title: "LP Staked Successfully", description: `Staked ${manageLpAmount} LP tokens`, variant: "default" })
      setManageLpAmount("")
      setLpInputError("")
      setLpTxStatus("Staked successfully!")
      await new Promise(resolve => setTimeout(resolve, 2000))
      await Promise.all([
        fetchLpBalance(),
        updateAllBalances(),
        refreshPools()
      ])
      setLpTxStatus("")
    } catch (error: any) {
      setLpTxError(error?.message || "Unknown error")
      toast({ title: "Error Staking LP", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" })
      setLpTxStatus("")
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  // Handle LP unstaking
  const handleUnstakeLp = async () => {
    if (!selectedPool || !address || !manageLpAmount) return
    setLpTxError("")
    setLpTxStatus("Checking allowance...")
    try {
      setIsRemovingLiquidity(true)
      const lpTokenAddress = selectedPool.address as `0x${string}`
      const vaultAddress = `0x${CONTRACT_ADDRESSES.mainnet.IVault.replace('0x', '')}` as `0x${string}`
      const amountToUnstake = -parseUnits(manageLpAmount, 18)

      // 2. Prepare tokens array
      const tokens = [
        toToken(lpTokenAddress),
        toToken(getPhasToken().address),
      ]
      // 3. Prepare deposit array (int128[])
      const deposits = [0n, 0n] // No deposit, just unstake
      // 4. Prepare ops array
      const poolId = toPoolId(GAUGE, lpTokenAddress)
      const tokenInformations = [
        toTokenInfo(0, EXACTLY, amountToUnstake), // unstake LP (negative amount)
        toTokenInfo(1, AT_MOST, 0n),             // harvest VC
      ]
      const ops = [{
        poolId,
        tokenInformations,
        data: '0x',
      }]
      // 5. Call execute
      setLpTxStatus("Unstaking LP...")
      const executeParams = {
        address: vaultAddress,
        abi: IVaultABI,
        functionName: 'execute',
        args: [tokens, deposits, ops],
        account: walletClient.account
      }
      const executeGas = await getAdjustedGasEstimate(publicClient, walletClient, executeParams)
      const hash = await walletClient.writeContract({
        ...executeParams,
        gas: executeGas,
      })
      setLpTxStatus("Waiting for confirmation...")
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction receipt:', receipt)
      toast({ title: "LP Unstaked Successfully", description: `Unstaked ${manageLpAmount} LP tokens`, variant: "default" })
      setManageLpAmount("")
      setLpInputError("")
      setLpTxStatus("Unstaked successfully!")
      await new Promise(resolve => setTimeout(resolve, 2000))
      await Promise.all([
        fetchLpBalance(),
        updateAllBalances(),
        refreshPools()
      ])
      setLpTxStatus("")
    } catch (error: any) {
      setLpTxError(error?.message || "Unknown error")
      toast({ title: "Error Unstaking LP", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" })
      setLpTxStatus("")
    } finally {
      setIsRemovingLiquidity(false)
    }
  }

  return (
    <div className="min-h-screen bg-black/40">
      <Toaster />
      <div className="max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border border-purple-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Link href="/liquidity">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-medium">Add Liquidity and Stake LP to earn rewards.</h1>
          </div>
        </div>

        {/* Pool Selection Dropdown */}
        <div className="mb-6">
          <Select
            value={selectedPool?.id.toString()}
            onValueChange={(value) => {
              const pool = pools.find(p => p.id.toString() === value)
              setSelectedPool(pool || null)
            }}
          >
            <SelectTrigger className="w-full bg-black/40 border-white/10">
              <SelectValue placeholder="Select a pool">
                {selectedPool && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                        {selectedPool.token0.logoURI ? (
                          <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-5 h-5" />
                        ) : (
                          selectedPool.token0.symbol.substring(0, 1)
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                        {selectedPool.token1.logoURI ? (
                          <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-5 h-5" />
                        ) : (
                          selectedPool.token1.symbol.substring(0, 1)
                        )}
                      </div>
                    </div>
                    <span>{selectedPool.token0.symbol}/{selectedPool.token1.symbol}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#00ffff33] text-cyan-400">
                      {selectedPool.version}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pools.map((pool) => (
                <SelectItem key={pool.id} value={pool.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                        {pool.token0.logoURI ? (
                          <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-5 h-5" />
                        ) : (
                          pool.token0.symbol.substring(0, 1)
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                        {pool.token1.logoURI ? (
                          <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-5 h-5" />
                        ) : (
                          pool.token1.symbol.substring(0, 1)
                        )}
                      </div>
                    </div>
                    <span>{pool.token0.symbol}/{pool.token1.symbol}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#00ffff33] text-cyan-400">
                      {pool.version}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Pool Info */}
          <div className="space-y-4">
            {/* Pool Info Section */}
            <div className="bg-black/40 border border-purple-500/50 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Pool Info</h3>
              {selectedPool && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs z-10">
                          {selectedPool.token0.logoURI ? (
                            <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-6 h-6" />
                          ) : (
                            selectedPool.token0.symbol.substring(0, 1)
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token1.logoURI ? (
                            <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-6 h-6" />
                          ) : (
                            selectedPool.token1.symbol.substring(0, 1)
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {selectedPool.token0.symbol}/{selectedPool.token1.symbol}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">100%</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#00ffff33] text-cyan-400">
                            {selectedPool.version}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-white/10">
                    <span className="text-sm text-gray-400">Swap Fee</span>
                    <span className="text-sm bg-white/10 px-2 py-1 rounded">{selectedPool.swapFee}%</span>
                  </div>
                </>
              )}
            </div>

            {/* Assets in Pool Section */}
            <div className="bg-black/40 border border-green-500/50 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Assets in Pool</h3>
              {selectedPool && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                        {selectedPool.token0.logoURI ? (
                          <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-5 h-5" />
                        ) : (
                          selectedPool.token0.symbol.substring(0, 1)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">{selectedPool.token0.symbol}</span>
                        <span className="text-xs text-gray-400">50%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{selectedPool.poolamountToken0} {selectedPool.token0.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                        {selectedPool.token1.logoURI ? (
                          <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-5 h-5" />
                        ) : (
                          selectedPool.token1.symbol.substring(0, 1)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">{selectedPool.token1.symbol}</span>
                        <span className="text-xs text-gray-400">50%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{selectedPool.poolamountToken1} {selectedPool.token1.symbol}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manage LP Section */}
            <div className="bg-black/40 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Manage LP</h3>
                <button onClick={() => setShowManageLpDialog(true)}>
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              {selectedPool && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-black/40 rounded-lg p-3">
                    <span className="text-sm text-gray-400">POOLED(NOT STAKED)</span>
                    <span className="text-sm">{parseFloat(lpBalance).toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 rounded-lg p-3">
                    <span className="text-sm text-gray-400">STAKED</span>
                    <span className="text-sm">{parseFloat(selectedPool.stakedLp || "0").toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Add Liquidity Actions */}
          <div className="space-y-4">
            {/* Action Tabs */}
            <div className="flex border-b border-white/10">
              <button
                className={`px-6 py-3 text-sm ${
                  activeTab === 'deposit'
                    ? 'text-white border-b-2 border-[#00ffff]'
                    : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('deposit')}
              >
                Deposit
              </button>
              <button
                className={`px-6 py-3 text-sm ${
                  activeTab === 'withdraw'
                    ? 'text-white border-b-2 border-[#00ffff]'
                    : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('withdraw')}
              >
                Withdraw
              </button>
            </div>

            {/* Deposit Section */}
            {activeTab === 'deposit' && selectedPool && (
              <div className="space-y-4">
                <div className="bg-black/40 border border-indigo-500/50 rounded-lg p-4">
                  {/* Token 0 Input */}
                  <div className="mb-4 border border-teal-500/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token0.logoURI ? (
                            <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-5 h-5" />
                          ) : (
                            selectedPool.token0.symbol.substring(0, 1)
                          )}
                        </div>
                        <span>{selectedPool.token0.symbol}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Balance: {parseFloat(tokenBalances[selectedPool.token0.symbol] || "0").toFixed(2)} {selectedPool.token0.symbol}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={amount0}
                      onChange={(e) => setAmount0(e.target.value)}
                      placeholder="0.0000000000"
                      className="bg-transparent border-none text-right outline-none w-full"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(25, 0)}
                      >
                        25%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(50, 0)}
                      >
                        50%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(75, 0)}
                      >
                        75%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(100, 0)}
                      >
                        100%
                      </Button>
                    </div>
                  </div>

                  {/* Token 1 Input */}
                  <div className="border border-emerald-500/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token1.logoURI ? (
                            <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-5 h-5" />
                          ) : (
                            selectedPool.token1.symbol.substring(0, 1)
                          )}
                        </div>
                        <span>{selectedPool.token1.symbol}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Balance: {parseFloat(tokenBalances[selectedPool.token1.symbol] || "0").toFixed(2)} {selectedPool.token1.symbol}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={amount1}
                      onChange={(e) => setAmount1(e.target.value)}
                      placeholder="0.0000000000"
                      className="bg-transparent border-none text-right outline-none w-full"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(25, 1)}
                      >
                        25%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(50, 1)}
                      >
                        50%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(75, 1)}
                      >
                        75%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handlePercentageClick(100, 1)}
                      >
                        100%
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Slippage Setting for Deposit */}
                <div className="bg-black/40 border border-amber-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Slippage</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={slippageDeposit}
                        onChange={(e) => setSlippageDeposit(e.target.value)}
                        className="w-16 bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-right"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Withdraw Section */}
            {activeTab === 'withdraw' && selectedPool && (
              <div className="space-y-4">
                {/* LP Input Section */}
                <div className="bg-black/40 border border-indigo-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token0.logoURI ? (
                            <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-5 h-5" />
                          ) : (
                            selectedPool.token0.symbol.substring(0, 1)
                          )}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token1.logoURI ? (
                            <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-5 h-5" />
                          ) : (
                            selectedPool.token1.symbol.substring(0, 1)
                          )}
                        </div>
                      </div>
                      <span>{selectedPool.token0.symbol}-{selectedPool.token1.symbol}-VLP</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Balance: {parseFloat(lpBalance).toFixed(6)}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={lpAmount}
                    onChange={handleLpAmountChange}
                    placeholder="0.0000000000"
                    className={`w-full bg-transparent text-3xl outline-none mb-2 ${
                      lpInputError ? 'border-red-500' : ''
                    }`}
                  />
                  {lpInputError && (
                    <div className="text-red-500 text-sm mt-1">
                      {lpInputError}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleLpPercentageClick(25)}
                    >
                      25%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleLpPercentageClick(50)}
                    >
                      50%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleLpPercentageClick(75)}
                    >
                      75%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleLpPercentageClick(100)}
                    >
                      100%
                    </Button>
                  </div>
                </div>

                {/* Receive Section */}
                <div className="bg-black/40 border border-indigo-500/50 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-4">You Will Receive</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token0.logoURI ? (
                            <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-5 h-5" />
                          ) : (
                            selectedPool.token0.symbol.substring(0, 1)
                          )}
                        </div>
                        <span>{quoteAmounts ? parseFloat(quoteAmounts.amount0).toFixed(6) : "0.000000"} {selectedPool.token0.symbol}</span>
                      </div>
                      <span className="text-sm text-gray-400">50%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs">
                          {selectedPool.token1.logoURI ? (
                            <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-5 h-5" />
                          ) : (
                            selectedPool.token1.symbol.substring(0, 1)
                          )}
                        </div>
                        <span>{quoteAmounts ? parseFloat(quoteAmounts.amount1).toFixed(6) : "0.000000"} {selectedPool.token1.symbol}</span>
                      </div>
                      <span className="text-sm text-gray-400">50%</span>
                    </div>
                  </div>
                </div>

                {/* Slippage Setting */}
                <div className="bg-black/40 border border-amber-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Slippage</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={slippageWithdraw}
                        onChange={(e) => setSlippageWithdraw(e.target.value)}
                        className="w-16 bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-right"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            {!isConnected ? (
              <Button 
                className="w-full bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90 text-white"
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            ) : (
              <Button 
                className="w-full bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90 text-white"
                onClick={handleAction}
                disabled={
                  !isConnected || 
                  (activeTab === 'deposit' ? 
                    (!amount0 || !amount1 || isAddingLiquidity) : 
                    (!lpAmount || isRemovingLiquidity || !!lpInputError)
                  )
                }
              >
                {!isConnected ? (
                  "Connect Wallet"
                ) : activeTab === 'deposit' ? (
                  isAddingLiquidity ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Adding Liquidity...
                    </div>
                  ) : (
                    "Add Liquidity"
                  )
                ) : (
                  isRemovingLiquidity ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Removing Liquidity...
                    </div>
                  ) : (
                    "Remove Liquidity"
                  )
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Manage LP Modal */}
      <Dialog open={showManageLpDialog} onOpenChange={setShowManageLpDialog}>
        <DialogContent className="max-w-md w-full bg-black/90 border border-yellow-500/50">
          <DialogHeader>
            <DialogTitle>Manage LP</DialogTitle>
          </DialogHeader>
          {selectedPool && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs z-10">
                    {selectedPool.token0.logoURI ? (
                      <img src={selectedPool.token0.logoURI} alt={selectedPool.token0.symbol} className="w-6 h-6" />
                    ) : (
                      selectedPool.token0.symbol.substring(0, 1)
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs">
                    {selectedPool.token1.logoURI ? (
                      <img src={selectedPool.token1.logoURI} alt={selectedPool.token1.symbol} className="w-6 h-6" />
                    ) : (
                      selectedPool.token1.symbol.substring(0, 1)
                    )}
                  </div>
                </div>
                <span className="font-bold text-lg">{selectedPool.token0.symbol}-{selectedPool.token1.symbol}-VLP</span>
              </div>
              <div className="bg-black/40 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">POOLED(NOT STAKED)</span>
                  <span className="text-sm">{parseFloat(lpBalance).toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">STAKED</span>
                  <span className="text-sm">{parseFloat(selectedPool.stakedLp || "0").toFixed(6)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={manageLpAmount}
                  onChange={handleManageLpAmountChange}
                  placeholder="0.0000000000"
                  className={`w-full bg-transparent text-3xl outline-none mb-2 ${lpInputError ? 'border-red-500' : ''}`}
                />
                {lpInputError && (
                  <div className="text-red-500 text-sm mt-1">{lpInputError}</div>
                )}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleManageLpPercentageClick(25)}>25%</Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleManageLpPercentageClick(50)}>50%</Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleManageLpPercentageClick(75)}>75%</Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleManageLpPercentageClick(100)}>100%</Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="w-1/2 bg-gradient-to-r from-cyberpink to-cyberblue text-white" 
                    onClick={handleStakeLp} 
                    disabled={!manageLpAmount || isAddingLiquidity || parseFloat(manageLpAmount) > parseFloat(lpBalance)}
                  >
                    {isAddingLiquidity ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Staking...</span> : "Stake"}
                  </Button>
                  <Button 
                    className="w-1/2 bg-gradient-to-r from-cyberblue to-cyberpink text-white" 
                    onClick={handleUnstakeLp} 
                    disabled={!manageLpAmount || isRemovingLiquidity || parseFloat(manageLpAmount) > parseFloat(selectedPool.stakedLp || "0")}
                  >
                    {isRemovingLiquidity ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Unstaking...</span> : "Unstake"}
                  </Button>
                </div>
                {lpTxStatus && <div className="text-cyan-400 text-sm mt-2">{lpTxStatus}</div>}
                {lpTxError && <div className="text-red-500 text-sm mt-2">{lpTxError}</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 