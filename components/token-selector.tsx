"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Token, SUPPORTED_TOKENS } from "@/lib/constants/tokens"
import { useWalletStore } from "@/lib/stores/wallet-store"

interface TokenSelectorProps {
  currentToken?: Token | null
  selectedToken?: Token | null
  onSelect: (token: Token) => void
  excludedToken?: string
  getTokenBalance: (symbol: string) => string
  isOpen?: boolean
  onClose?: () => void
  onClick?: () => void
}

export default function TokenSelector({ 
  currentToken, 
  selectedToken, 
  onSelect, 
  excludedToken,
  getTokenBalance,
  isOpen = false,
  onClose = () => {},
  onClick
}: TokenSelectorProps) {
  const { 
    isConnected, 
    address, 
    tokenBalances,
    updateAllBalances,
    isLoading: isWalletLoading
  } = useWalletStore()
  
  const [search, setSearch] = useState("")
  const [localTokens, setLocalTokens] = useState<Token[]>(SUPPORTED_TOKENS)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Use the token from either currentToken or selectedToken prop
  const token = currentToken || selectedToken

  // Update tokens when dialog opens - with debounce to prevent infinite loops
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if ((isOpen || dialogOpen) && isConnected && address && !isWalletLoading && !isUpdating) {
      console.log("Calling updateAllBalances in Token Selector")
      setIsUpdating(true)
      timeoutId = setTimeout(() => {
      updateAllBalances()
          .finally(() => {
            setIsUpdating(false)
          })
      }, 1000) // 1 second debounce
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isOpen, dialogOpen, isConnected, address, updateAllBalances, isWalletLoading, isUpdating])

  // Update local tokens when balances change - with memoization to prevent unnecessary updates
  useEffect(() => {
    if (isConnected && address && tokenBalances && !isWalletLoading) {
      const filteredTokens = SUPPORTED_TOKENS
        .filter(token => token.symbol !== excludedToken)
        .map(token => ({
          ...token,
          balance: getTokenBalance(token.symbol)
        }))
      setLocalTokens(filteredTokens)
    }
  }, [isConnected, address, tokenBalances, excludedToken, isWalletLoading, getTokenBalance])

  const handleSelect = useCallback((token: Token) => {
    onSelect(token)
    if (onClose) {
      onClose()
    } else {
      setDialogOpen(false)
    }
  }, [onSelect, onClose])

  const handleDialogChange = useCallback((open: boolean) => {
    if (onClose) {
      onClose()
    } else {
      setDialogOpen(open)
    }
  }, [onClose])

  const filteredTokens = useMemo(() => {
    return localTokens.filter(token => 
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [localTokens, search])

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="ml-2 flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10"
          onClick={(e) => {
            e.preventDefault();
            if (onClick) onClick();
          }}
        >
          <div className="flex items-center gap-2">
            {token && token.logoURI && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center text-xs">
                <img src={token.logoURI} alt={token.symbol} className="w-4 h-4" />
              </div>
            )}
            <span>{token?.symbol || "Select Token"}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 5L6 8L9 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
          <DialogDescription>
            Choose a token to swap or add to your wallet
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or paste address"
              className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
          </div>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredTokens.map((token) => (
            <Button
              key={token.symbol}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleSelect(token)}
            >
                <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center text-xs">
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span>{token.symbol}</span>
                  <span className="text-xs text-muted-foreground">{token.name}</span>
                </div>
              </div>
              <div className="ml-auto">
                <span className="text-sm">{token.balance || "0.00"}</span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
