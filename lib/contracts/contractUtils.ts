import { PublicClient, WalletClient } from 'viem'

export async function getAdjustedGasEstimate(
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: any // Using any to maintain compatibility with existing code
) {
  // Check if wallet client and account exist
  if (!walletClient || !walletClient.account || !walletClient.account.address) {
    throw new Error('Wallet client or account is not properly initialized')
  }

  try {
    // Get base gas estimate
    const gasEstimate = await publicClient.estimateGas({
      ...params,
      account: walletClient.account.address,
    })
    console.log('gasEstimate', gasEstimate)

    // Add 1.2 gwei buffer for Pharos network
    const adjustedGas = gasEstimate + BigInt(10000000) // 1.2 gwei in wei
    console.log('adjustedGas', adjustedGas)
    return adjustedGas
  } catch (error) {
    console.error('Error estimating gas:', error)
    throw new Error('Failed to estimate gas for transaction')
  }
} 