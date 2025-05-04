"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { PHAROS_CHAIN } from "@/lib/constants/chains"

const networks = [
  { 
    id: PHAROS_CHAIN.id.toString(), 
    name: PHAROS_CHAIN.name, 
    icon: "",
    chain: PHAROS_CHAIN 
  }
]

export default function NetworkSelector() {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-white/20 bg-black/40 hover:bg-black/60 text-white flex items-center gap-2"
        >
          <span className="text-xl">{selectedNetwork.icon}</span>
          <span className="hidden sm:inline">{selectedNetwork.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/90 backdrop-blur-md border border-white/10">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            className={`flex items-center gap-2 cursor-pointer ${
              selectedNetwork.id === network.id ? "bg-cyberpurple/30 text-cyberblue" : "hover:bg-cyberpurple/20"
            }`}
            onClick={() => setSelectedNetwork(network)}
          >
            <span className="text-xl">{network.icon}</span>
            <span>{network.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
