"use client"

import { useEffect } from 'react'
import { useWalletStore } from '@/lib/stores/wallet-store'
import { PHAROS_CHAIN } from '@/lib/constants/chains'
import { createWalletClient, custom } from 'viem'

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const {
    address,
    chainId,
    isConnected,
    isWrongNetwork,
    setAddress,
    setChainId,
    setIsConnected,
    setIsWrongNetwork,
    resetWalletState,
    updateAllBalances,
    fetchNativeTokenBalance,
    setWalletClient
  } = useWalletStore()

  // Check initial connection
  useEffect(() => {
    const checkInitialConnection = async () => {
      if (!window.ethereum) return
      
      try {
        const storedState = localStorage.getItem('walletState')
        
        if (storedState) {
          const { address, chainId, isConnected } = JSON.parse(storedState)
          
          if (isConnected) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
            
            const normalizedStoredAddress = address.toLowerCase()
            const normalizedCurrentAddress = accounts[0]?.toLowerCase()
            
            if (accounts.length > 0 && normalizedCurrentAddress === normalizedStoredAddress && parseInt(currentChainId) === chainId) {
              setAddress(address)
              setChainId(chainId)
              setIsConnected(true)
              setIsWrongNetwork(chainId !== PHAROS_CHAIN.id)
              
              const client = createWalletClient({
                chain: PHAROS_CHAIN,
                transport: custom(window.ethereum)
              });
              setWalletClient(client);
              
              // Fetch native token balance immediately after restoring state
              const nativeBalance = await fetchNativeTokenBalance(address)
              useWalletStore.setState({ walletBalance: nativeBalance })
              
              // Update all token balances
              await updateAllBalances()
              return
            }
          }
        }
        
        resetWalletState()
        localStorage.removeItem('walletState')
      } catch (error) {
        console.error('Error checking initial connection:', error)
        resetWalletState()
        localStorage.removeItem('walletState')
      }
    }

    checkInitialConnection()
  }, [])

  // Listen for wallet events
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('Accounts changed:', accounts)
      if (accounts.length === 0) {
        resetWalletState()
        return
      }
      
      const newAddress = accounts[0]
      setAddress(newAddress)
      
      // Update connection state
      setIsConnected(true)
      
      // Update native token balance immediately
      const nativeBalance = await fetchNativeTokenBalance(newAddress)
      useWalletStore.setState({ walletBalance: nativeBalance })
      
      // Then update all token balances
      await updateAllBalances()
    }

    const handleConnect = async () => {
      console.log('Wallet connected event')
      // Don't auto-connect, wait for explicit connect call
    }

    const handleDisconnect = () => {
      console.log('Wallet disconnected event')
      resetWalletState()
    }

    const handleChainChanged = async (chainId: string) => {
      console.log('Chain changed:', chainId)
      const numericChainId = parseInt(chainId)
      setChainId(numericChainId)
      setIsWrongNetwork(numericChainId !== PHAROS_CHAIN.id)
      if (isConnected) {
        await updateAllBalances()
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('connect', handleConnect)
    window.ethereum.on('disconnect', handleDisconnect)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.off('accountsChanged', handleAccountsChanged)
      window.ethereum.off('connect', handleConnect)
      window.ethereum.off('disconnect', handleDisconnect)
      window.ethereum.off('chainChanged', handleChainChanged)
    }
  }, [isConnected])

  return <>{children}</>
} 