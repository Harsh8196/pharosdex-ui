"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Info, Plus, Search, ChevronDown, X } from "lucide-react"
import TokenSelector from "./token-selector"
import SwapSettings from "./swap-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Token, SUPPORTED_TOKENS } from "@/lib/constants/tokens"
import { useRouter } from "next/navigation"
import { usePoolData } from "@/hooks/usePoolData"

export default function LiquidityInterface() {
  const router = useRouter()
  const { pools, loading, error } = usePoolData()
  const [searchQuery, setSearchQuery] = useState("")
  const [showValueOnly, setShowValueOnly] = useState(false)
  const [showWhitelistedOnly, setShowWhitelistedOnly] = useState(false)
  const [showStakedOnly, setShowStakedOnly] = useState(false)
  const [selectedTab, setSelectedTab] = useState("prime")
  const [showAddLiquidityDialog, setShowAddLiquidityDialog] = useState(false)

  // Filter pools based on search and tab
  const filteredPools = pools.filter(pool => {
    if (selectedTab !== "prime") return false
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        pool.token0.symbol.toLowerCase().includes(searchLower) ||
        pool.token1.symbol.toLowerCase().includes(searchLower) ||
        pool.token0.name.toLowerCase().includes(searchLower) ||
        pool.token1.name.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyberpink to-cyberblue bg-clip-text text-transparent">
          Pool
        </h1>
        <p className="text-sm text-gray-400">
          Stake liquidity to earn trading fees and rewards.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button
          className="bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90 text-white gap-2 w-full sm:w-auto text-sm"
          size="lg"
          onClick={() => setShowAddLiquidityDialog(true)}
                >
          <Plus className="h-4 w-4" />
          ADD LIQUIDITY
                </Button>

        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ETH, USDT, 0x..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 border-white/10 w-full text-base"
          />
        </div>

        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-xs text-gray-400">$ VALUE</span>
            <Switch
              checked={showValueOnly}
              onCheckedChange={setShowValueOnly}
            />
            </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">WHITELISTED POOLS</span>
            <Switch
              checked={showWhitelistedOnly}
              onCheckedChange={setShowWhitelistedOnly}
            />
            </div>

          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-xs text-gray-400">STAKED</span>
            <Switch
              checked={showStakedOnly}
              onCheckedChange={setShowStakedOnly}
            />
                  </div>
              </div>
            </div>

      {/* Pool Categories */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger
            value="prime"
            className="flex-1 min-w-[100px] text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4CAF50]/20 data-[state=active]:to-[#4CAF50]/20 data-[state=active]:text-[#4CAF50]"
          >
            PRIME
          </TabsTrigger>
          <TabsTrigger
            value="lst"
            className="flex-1 min-w-[100px] text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
          >
            LST/LRT
          </TabsTrigger>
          <TabsTrigger
            value="meme"
            className="flex-1 min-w-[100px] text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
          >
            MEME
          </TabsTrigger>
          <TabsTrigger
            value="pharos"
            className="flex-1 min-w-[100px] text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
          >
            PHAROS NATIVES
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex-1 min-w-[100px] text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
          >
            ALL
          </TabsTrigger>
        </TabsList>

        {/* Pool Table */}
        <div className="mt-6 -mx-4 sm:mx-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyberpink"></div>
              </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {error}
            </div>
          ) : filteredPools.length > 0 ? (
            <>
              {/* Desktop Headers */}
              <div className="hidden sm:grid grid-cols-6 gap-4 px-4 py-2 text-xs text-gray-400">
                <div>POOL</div>
                <div>APR</div>
                <div className="flex items-center gap-1">
                  TVL
                  <ChevronDown className="h-3 w-3" />
                </div>
                <div>TOTAL POOL AMOUNT</div>
                <div>VOLUME (24H)</div>
                <div>FEES (24H)</div>
              </div>

              <div className="space-y-2">
                {filteredPools.map((pool) => (
                  <div
                    key={pool.id}
                    className="block sm:grid grid-cols-6 gap-4 p-4 bg-black/40 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {/* Pool Info - Always Visible */}
                    <div className="flex items-center gap-3 mb-4 sm:mb-0">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center text-xs z-10 border-2 border-black">
                          {pool.token0.logoURI ? (
                            <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-5 h-5" />
                          ) : (
                            pool.token0.symbol.substring(0, 1)
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberblue to-cyberpink flex items-center justify-center text-xs border-2 border-black">
                          {pool.token1.logoURI ? (
                            <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-5 h-5" />
                          ) : (
                            pool.token1.symbol.substring(0, 1)
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2 flex-wrap text-sm">
                          {pool.token0.symbol}/{pool.token1.symbol}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                            {pool.version}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout - Additional Columns */}
                    <div className="hidden sm:block text-green-400 font-medium text-sm self-center">
                      {pool.apr}
                    </div>
                    {/* <div className="hidden sm:block font-medium text-sm self-center">
                      {pool.tvl}
                    </div> */}
                    <div className="font-medium flex gap-2 flex-wrap text-sm flex-col">
                      <span>{pool.poolamountToken0} {pool.token0.symbol}</span>
                      <span>{pool.poolamountToken1} {pool.token1.symbol}</span>
                    </div>
                    <div className="font-medium flex items-center gap-2 flex-wrap text-sm flex-col">
                      <span>{pool.poolamountToken0} {pool.token0.symbol}</span>
                      <span>{pool.poolamountToken1} {pool.token1.symbol}</span>
                    </div>
                    <div className="hidden sm:block font-medium text-sm self-center">
                      0
                    </div>
                    <div className="hidden sm:block font-medium text-sm self-center">
                      0
                    </div>

                    {/* Mobile Layout - Grid for remaining info */}
                    <div className="grid grid-cols-2 gap-4 sm:hidden mt-4">
                        <div>
                        <div className="text-xs text-gray-400 mb-1">APR</div>
                        <div className="text-green-400 font-medium text-sm">{pool.apr}</div>
                        </div>
                        <div>
                        <div className="text-xs text-gray-400 mb-1">TVL</div>
                        <div className="font-medium text-sm">{pool.tvl}</div>
                        </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">VOLUME (24H)</div>
                        <div className="font-medium text-sm">{pool.volume24h}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">FEES (24H)</div>
                        <div className="font-medium text-sm">{pool.fees24h}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
            ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="text-gray-400 mb-4">No pools available in this category</div>
              <Button
                className="bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90 text-white gap-2"
                onClick={() => setShowAddLiquidityDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Create New Pool
              </Button>
              </div>
            )}
        </div>
        </Tabs>

      {/* Add Liquidity Dialog */}
      <Dialog open={showAddLiquidityDialog} onOpenChange={setShowAddLiquidityDialog}>
        <DialogContent className="bg-[#1c1c1c] border-white/10 p-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">ADD LIQUIDITY</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                className="flex flex-col items-center justify-center gap-3 h-auto py-8 bg-black/40 border border-white/10 hover:bg-white/5"
                onClick={() => {
                  setShowAddLiquidityDialog(false)
                  // Add navigation or state management for creating new pool
                }}
                disabled
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center opacity-50">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold mb-1">CREATE</div>
                  <div className="text-xs text-gray-400">A NEW POOL</div>
                </div>
              </Button>

              <Button
                className="flex flex-col items-center justify-center gap-3 h-auto py-8 bg-black/40 border border-white/10 hover:bg-white/5"
                onClick={() => {
                  setShowAddLiquidityDialog(false)
                  router.push("/add-liquidity")
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyberblue to-cyberpink flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold mb-1">ADD LIQUIDITY</div>
                  <div className="text-xs text-gray-400">TO EXISTING POOLS</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
