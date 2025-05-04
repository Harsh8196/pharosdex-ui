import { Address, PublicClient } from 'viem';
import { CONTRACT_ADDRESSES } from './addresses';
import IVaultABI from './abis/IVault.json';
import { parseUnits, formatUnits } from 'viem';
import { PHAROS_CHAIN } from '@/lib/constants/chains';
import { SUPPORTED_TOKENS, Token } from '@/lib/constants/tokens';

export interface TokenWithDecimals {
  symbol: string;
  address: string;
  decimals: number;
}

// Utility to get the correct address for a token (handles native/wrapped)
export function getTokenAddress(token: TokenWithDecimals) {
  // Find the token in SUPPORTED_TOKENS to get the canonical address
  const found = SUPPORTED_TOKENS.find(t => t.symbol === token.symbol);
  if (!found) throw new Error(`Token ${token.symbol} not found in SUPPORTED_TOKENS`);
  // If native token, use 0 address (not wrapped address)
  if (found.symbol === PHAROS_CHAIN.nativeCurrency.symbol) {
    return '0x0000000000000000000000000000000000000000';
  }
  return found.address;
}

// Check if a pool exists for two tokens (try both orders, use simulateContract for static call)
export async function checkPoolExists({
  client,
  tokenA,
  tokenB,
}: {
  client: PublicClient;
  tokenA: TokenWithDecimals;
  tokenB: TokenWithDecimals;
}) {
  const addrA = getTokenAddress(tokenA) as Address;
  const addrB = getTokenAddress(tokenB) as Address;
  const vaultAddress = CONTRACT_ADDRESSES.mainnet.IVault as Address;

  // Try original order
  try {
    const { result: pool } = await client.simulateContract({
      address: vaultAddress,
      abi: IVaultABI,
      functionName: 'getPair',
      args: [addrA, addrB],
      account: client.account || addrA,
    });
    if (pool && pool !== '0x0000000000000000000000000000000000000000') return pool;
  } catch (err) {
    // Try reverse order if reverted
    try {
      const { result: pool } = await client.simulateContract({
        address: vaultAddress,
        abi: IVaultABI,
        functionName: 'getPair',
        args: [addrB, addrA],
        account: client.account || addrB,
      });
      if (pool && pool !== '0x0000000000000000000000000000000000000000') return pool;
    } catch (err2) {
      // Both failed, return null
      return null;
    }
  }
  return null;
}

// Get quote for a swap (use simulateContract for static call)
export async function getQuote({
  client,
  fromToken,
  toToken,
  amountIn,
  stable = false,
}: {
  client: PublicClient;
  fromToken: TokenWithDecimals;
  toToken: TokenWithDecimals;
  amountIn: string;
  stable?: boolean;
}) {
  const addrFrom = getTokenAddress(fromToken) as Address;
  const addrTo = getTokenAddress(toToken) as Address;
  const path = [{ from: addrFrom, to: addrTo, stable }];
  const parsedAmount = parseUnits(amountIn, fromToken.decimals);
  const vaultAddress = CONTRACT_ADDRESSES.mainnet.IVault as Address;
  console.log('Get quote arguments: ',[parsedAmount,path])
  const { result: amounts } = await client.simulateContract({
    address: vaultAddress,
    abi: IVaultABI,
    functionName: 'getAmountsOut',
    args: [parsedAmount, path],
    account: client.account || addrFrom,
  });
  return amounts;
} 