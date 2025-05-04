"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"

interface LiquidityPositionsProps {
  showRemoveButton?: boolean
}

export default function LiquidityPositions({ showRemoveButton = false }: LiquidityPositionsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)

  // Mock liquidity positions
  const positions = [
    {
      id: 1,
      token0: { symbol: "ETH", name: "Ethereum" },
      token1: { symbol: "USDC", name: "USD Coin" },
      poolShare: "0.02%",
      value: "$12,450",
      token0Amount: "2.5",
      token1Amount: "5,500",
      apr: "12.4%",
    },
    {
      id: 2,
      token0: { symbol: "WBTC", name: "Wrapped Bitcoin" },
      token1: { symbol: "ETH", name: "Ethereum" },
      poolShare: "0.01%",
      value: "$8,320",
      token0Amount: "0.08",
      token1Amount: "1.2",
      apr: "8.7%",
    },
    {
      id: 3,
      token0: { symbol: "ETH", name: "Ethereum" },
      token1: { symbol: "DAI", name: "Dai Stablecoin" },
      poolShare: "0.05%",
      value: "$25,100",
      token0Amount: "5.2",
      token1Amount: "11,220",
      apr: "15.2%",
    },
  ]

  const handleRemove = (position: any) => {
    setSelectedPosition(position)
    setShowRemoveDialog(true)
  }

  return (
    <div className="space-y-4">
      {positions.length > 0 ? (
        positions.map((position) => (
          <div key={position.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs z-10 border-2 border-gray-800">
                    {position.token0.symbol.substring(0, 1)}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-xs border-2 border-gray-800">
                    {position.token1.symbol.substring(0, 1)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">
                    {position.token0.symbol}/{position.token1.symbol}
                  </div>
                  <div className="text-xs text-gray-400">Pool share: {position.poolShare}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{position.value}</div>
                <div className="text-xs text-green-500">APR: {position.apr}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-gray-900/50 p-2 rounded">
                <div className="text-gray-400">Your tokens:</div>
                <div>
                  {position.token0Amount} {position.token0.symbol}
                </div>
                <div>
                  {position.token1Amount} {position.token1.symbol}
                </div>
              </div>
              <div className="bg-gray-900/50 p-2 rounded">
                <div className="text-gray-400">Earned fees:</div>
                <div className="text-green-500">+0.12 {position.token0.symbol}</div>
                <div className="text-green-500">+45.32 {position.token1.symbol}</div>
              </div>
            </div>
            {showRemoveButton && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleRemove(position)}>
                Remove Liquidity
              </Button>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">You don't have any liquidity positions yet.</p>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Link href="/liquidity">Add Liquidity</Link>
          </Button>
        </div>
      )}

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Liquidity</DialogTitle>
            <DialogDescription>
              How much would you like to remove from the {selectedPosition?.token0.symbol}/
              {selectedPosition?.token1.symbol} pool?
            </DialogDescription>
          </DialogHeader>

          {selectedPosition && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs z-10 border-2 border-gray-800">
                      {selectedPosition.token0.symbol.substring(0, 1)}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-xs border-2 border-gray-800">
                      {selectedPosition.token1.symbol.substring(0, 1)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedPosition.token0.symbol}/{selectedPosition.token1.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{selectedPosition.value}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount to remove</Label>
                <div className="flex items-center gap-2">
                  <Slider defaultValue={[50]} max={100} step={1} />
                  <div className="w-12 text-center">50%</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span>You will receive:</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    {(Number(selectedPosition.token0Amount) * 0.5).toFixed(4)} {selectedPosition.token0.symbol}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                    {selectedPosition.token0.symbol.substring(0, 1)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    {(Number(selectedPosition.token1Amount.replace(",", "")) * 0.5).toFixed(2)}{" "}
                    {selectedPosition.token1.symbol}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs">
                    {selectedPosition.token1.symbol.substring(0, 1)}
                  </div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Remove Liquidity
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
