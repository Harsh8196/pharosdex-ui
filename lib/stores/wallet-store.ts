import { create } from 'zustand'
import { createPublicClient, createWalletClient, custom, http, Address, formatEther, formatUnits, WalletClient } from 'viem'
import { PHAROS_CHAIN, RPC_URL } from '@/lib/constants/chains'
import { SUPPORTED_TOKENS, Token } from '@/lib/constants/tokens'

interface WalletState {
  // State properties
  address: string | null
  chainId: number | null
  isConnected: boolean
  isWrongNetwork: boolean
  walletBalance: string
  tokenBalances: Record<string, string>
  isLoading: boolean
  showWalletDialog: boolean
  publicClient: any
  walletClient: any
  balances: { [key: string]: bigint }

  // Action properties
  setAddress: (address: string | null) => void
  setChainId: (chainId: number | null) => void
  setIsConnected: (isConnected: boolean) => void
  setIsWrongNetwork: (isWrongNetwork: boolean) => void
  setWalletBalance: (balance: string) => void
  setTokenBalances: (balances: Record<string, string>) => void
  setIsLoading: (isLoading: boolean) => void
  setShowWalletDialog: (show: boolean) => void
  setPublicClient: (client: any) => void
  setWalletClient: (client: any) => void
  setBalances: (balances: { [key: string]: bigint }) => void
  resetWalletState: () => void
  fetchTokenBalance: (token: Token) => Promise<string>
  updateAllBalances: () => Promise<void>
  fetchNativeTokenBalance: (address: string) => Promise<string>
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  openWalletDialog: () => void
  closeWalletDialog: () => void
}

const initializeWalletClient = (address: string) => {
  if (!window.ethereum) return null
  
  try {
    const client = createWalletClient({
      chain: {
        ...PHAROS_CHAIN,
        rpcUrls: {
          default: { http: [RPC_URL] },
          public: { http: [RPC_URL] }
        }
      },
      transport: custom(window.ethereum),
      account: address as `0x${string}`
    })
    return client as unknown as WalletClient
  } catch (error) {
    console.error('Error initializing wallet client:', error)
    return null
  }
}

export const useWalletStore = create<WalletState>((set, get) => {
  // Initialize from localStorage
  let storedState = null
  if (typeof window !== 'undefined') {
    storedState = localStorage.getItem('walletState')
  }

  let initialState: Partial<WalletState> = {
    address: null,
    chainId: null,
    isConnected: false,
    isWrongNetwork: false,
    walletBalance: "0",
    tokenBalances: {},
    isLoading: false,
    showWalletDialog: false,
    publicClient: createPublicClient({
      chain: PHAROS_CHAIN,
      transport: http()
    }),
    walletClient: null,
    balances: {}
  }

  if (storedState) {
    try {
      const { address, chainId, isConnected } = JSON.parse(storedState)
      if (address && chainId && isConnected && typeof window !== 'undefined') {
        const walletClient = initializeWalletClient(address)
        console.log('Wallet client from local storage:', walletClient)
        if (walletClient) {
          initialState = {
            ...initialState,
            address,
            chainId,
            isConnected,
            isWrongNetwork: chainId !== PHAROS_CHAIN.id,
            walletClient: walletClient as any
          }
        }
      }
    } catch (error) {
      console.error('Error restoring wallet state:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletState')
      }
    }
  }
  console.log('Initial state:', initialState)
  return {
    ...initialState,
    
    // Simple actions
    setAddress: (address) => set({ address }),
    setChainId: (chainId) => set({ chainId }),
    setIsConnected: (isConnected) => set({ isConnected }),
    setIsWrongNetwork: (isWrongNetwork) => set({ isWrongNetwork }),
    setWalletBalance: (walletBalance) => set({ walletBalance }),
    setTokenBalances: (tokenBalances) => set({ tokenBalances }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setShowWalletDialog: (showWalletDialog) => set({ showWalletDialog }),
    setPublicClient: (publicClient) => set({ publicClient }),
    setWalletClient: (walletClient) => set({ walletClient }),
    setBalances: (balances) => set({ balances }),

    // Complex actions
    resetWalletState: () => {
      console.log('Resetting wallet state')
      set({
        address: null,
        chainId: null,
        isConnected: false,
        isWrongNetwork: false,
        walletBalance: "0",
        tokenBalances: {},
        walletClient: null
      })
    },

    fetchTokenBalance: async (token) => {
      const { address, publicClient } = get()
      if (!address || !publicClient) return "0"
      
      try {
        // For native token (PTT), use getBalance
        if (token.symbol === "PTT") {
          const balance = await publicClient.getBalance({ address: address as Address })
          return formatEther(balance)
        }

        // For ERC20 tokens, use the token contract
        const balance = await publicClient.readContract({
          address: token.address as Address,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }
          ],
          functionName: 'balanceOf',
          args: [address as Address],
        })

        // Format the balance based on token decimals
        return formatUnits(balance, token.decimals)
      } catch (error) {
        console.error(`Error fetching ${token.symbol} balance:`, error)
        return "0"
      }
    },

    updateAllBalances: async () => {
      const { address, publicClient, fetchTokenBalance } = get()
      if (!address || !publicClient) return
      
      console.log('Updating all balances for address:', address)
      try {
        // Update token balances
        const newBalances: Record<string, string> = {}
        for (const token of SUPPORTED_TOKENS) {
          newBalances[token.symbol] = await fetchTokenBalance(token)
        }
        set({ tokenBalances: newBalances })
        
        console.log('Balances updated successfully')
      } catch (error) {
        console.error("Error updating balances:", error)
      }
    },

    fetchNativeTokenBalance: async (address) => {
      const { publicClient } = get()
      if (!address || !publicClient) return "0"
      try {
        const balance = await publicClient.getBalance({ address: address as Address })
        return formatEther(balance)
      } catch (error) {
        console.error("Error fetching native token balance:", error)
        return "0"
      }
    },

    connectWallet: async () => {
      console.log('Connecting wallet...')
      set({ isLoading: true })
      try {
        if (!window.ethereum) {
          throw new Error("No ethereum wallet found")
        }

        // Create initial client to get address
        const client = createWalletClient({
          chain: PHAROS_CHAIN,
          transport: custom(window.ethereum)
        })

        const [address] = await client.requestAddresses()
        const chainId = await client.getChainId()
        
        // Create a new wallet client with the account and direct RPC URL
        const walletClient = createWalletClient({
          chain: {
            ...PHAROS_CHAIN,
            rpcUrls: {
              default: { http: [RPC_URL] },
              public: { http: [RPC_URL] }
            }
          },
          transport: custom(window.ethereum),
          account: address as `0x${string}`
        })
        
        console.log('Wallet connected:', { address, chainId })
        
        set({
          walletClient,
          address,
          chainId,
          isConnected: true,
          isWrongNetwork: chainId !== PHAROS_CHAIN.id
        })
        
        // Fetch native token balance
        const nativeBalance = await get().fetchNativeTokenBalance(address)
        set({ walletBalance: nativeBalance })
        
        // Store the wallet state
        localStorage.setItem('walletState', JSON.stringify({
          address,
          chainId,
          isConnected: true
        }))
        
        // Update all token balances
        await get().updateAllBalances()
      } catch (error) {
        console.error("Error connecting wallet:", error)
        get().resetWalletState()
        localStorage.removeItem('walletState')
      } finally {
        set({ isLoading: false })
      }
    },

    disconnectWallet: () => {
      console.log('Disconnecting wallet')
      get().resetWalletState()
      localStorage.removeItem('walletState')
    },

    openWalletDialog: () => {
      console.log('Opening wallet dialog')
      set({ showWalletDialog: true })
    },

    closeWalletDialog: () => {
      console.log('Closing wallet dialog')
      set({ showWalletDialog: false })
    },
  } as WalletState
}) 