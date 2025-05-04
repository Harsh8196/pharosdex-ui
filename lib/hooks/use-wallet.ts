"use client"

import { useWalletStore } from '@/lib/stores/wallet-store'

export function useWallet() {
  return useWalletStore()
} 