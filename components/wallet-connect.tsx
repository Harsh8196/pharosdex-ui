"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWalletStore } from "@/lib/stores/wallet-store"
import { useState, useEffect } from "react"

export default function WalletConnect() {
  const {
    address,
    isConnected,
    isWrongNetwork,
    walletBalance,
    connectWallet,
    disconnectWallet,
    isLoading
  } = useWalletStore()

  const [showCopied, setShowCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Debug wallet state
  useEffect(() => {
    console.log('WalletConnect state:', {
      isConnected,
      isLoading,
      address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
      isWrongNetwork,
      isOpen
    })
  }, [isConnected, isLoading, address, isWrongNetwork, isOpen])

  // Format balance to 2 decimal places
  const formattedBalance = Number(walletBalance).toFixed(2)

  // Format address to show only first and last few characters
  const formatAddress = (address: string | null) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  const handleConnect = async () => {
    try {
      console.log("WalletConnect: Initiating wallet connection")
      await connectWallet()
      console.log("WalletConnect: Wallet connection successful")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const handleDisconnect = () => {
    console.log("WalletConnect: Disconnecting wallet")
    disconnectWallet()
    setIsOpen(false)
  }

  if (isConnected && !isWrongNetwork) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-white/20 bg-black/40 hover:bg-black/60 text-white"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="hidden sm:inline">{formattedBalance} PTT</span>
              <span>{address ? formatAddress(address) : "..."}</span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[300px] bg-[#2A2A2A] border-none p-0 gap-0">
          <DialogHeader>
            <DialogTitle className="sr-only">Wallet Details</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-[#4BB2F9] flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
            </div>
            <div className="text-xl font-medium">{address ? formatAddress(address) : "..."}</div>
            <div className="text-gray-400">{formattedBalance} PTT</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-700 border-t border-gray-700">
            <Button 
              variant="ghost" 
              className="rounded-none h-14 text-[#4BB2F9] hover:text-[#4BB2F9]/90 hover:bg-gray-800"
              onClick={copyAddress}
              disabled={!address}
            >
              <div className="flex items-center gap-2">
                {showCopied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Address
                  </>
                )}
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="rounded-none h-14 text-red-500 hover:text-red-400 hover:bg-gray-800"
              onClick={handleDisconnect}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Disconnect
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Button 
      className="bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90 text-white"
      disabled={isLoading}
      onClick={handleConnect}
    >
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
