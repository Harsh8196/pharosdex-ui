"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface SwapSettingsProps {
  isOpen: boolean
  onClose: () => void
  slippage: string
  onSlippageChange: (value: string) => void
}

export default function SwapSettings({ isOpen, onClose, slippage, onSlippageChange }: SwapSettingsProps) {
  const [customSlippage, setCustomSlippage] = useState(slippage === "custom")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#2A2A2A] border-none p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-2">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Slippage Tolerance</Label>
              <RadioGroup 
                value={customSlippage ? "custom" : slippage} 
                onValueChange={val => { 
                  if (val === "custom") {
                    setCustomSlippage(true);
                  } else {
                    setCustomSlippage(false);
                    onSlippageChange(val);
                  }
                }} 
                className="flex flex-wrap gap-2 mb-2"
              >
                {["0.1", "0.5", "1.0"].map(val => (
                  <div className="flex items-center" key={val}>
                    <RadioGroupItem value={val} id={`slippage-${val}`} className="sr-only" />
                    <Label
                      htmlFor={`slippage-${val}`}
                      className={`px-3 py-1 rounded-md cursor-pointer ${
                        slippage === val ? "bg-gradient-to-r from-cyberpink to-cyberblue text-white" : "bg-black/60 hover:bg-cyberpurple/30 border border-white/10"
                      }`}
                    >
                      {val}%
                    </Label>
                  </div>
                ))}
                <div className="flex items-center">
                  <RadioGroupItem value="custom" id="slippage-custom" className="sr-only" />
                  <Label
                    htmlFor="slippage-custom"
                    className={`px-3 py-1 rounded-md cursor-pointer ${
                      customSlippage ? "bg-gradient-to-r from-cyberpink to-cyberblue text-white" : "bg-black/60 hover:bg-cyberpurple/30 border border-white/10"
                    }`}
                  >
                    Custom
                  </Label>
                </div>
              </RadioGroup>
              {customSlippage && (
                <div className="space-y-2">
                  <Slider
                    defaultValue={[Number.parseFloat(slippage) || 0.1]}
                    max={5}
                    step={0.1}
                    onValueChange={val => onSlippageChange(val[0].toString())}
                    className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyberpink [&_[role=slider]]:to-cyberblue [&_[role=slider]]:border-none"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.1%</span>
                    <span>5%</span>
                  </div>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      value={slippage}
                      onChange={e => {
                        const value = e.target.value;
                        // Validate the input
                        const numValue = parseFloat(value);
                        if (isNaN(numValue) || numValue < 0.1 || numValue > 5) {
                          return; // Don't update if invalid
                        }
                        onSlippageChange(value);
                      }}
                      className="w-20 mr-2 bg-black/60 border-white/10"
                    />
                    <span>%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end p-6 pt-0">
          <Button onClick={onClose} className="bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 