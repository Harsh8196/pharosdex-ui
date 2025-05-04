import { useMemo } from "react";
import { ethers } from "ethers";

export function useContract(address: string, abi: any, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return useMemo(() => {
    if (!address || !abi || !signerOrProvider) return null;
    return new ethers.Contract(address, abi, signerOrProvider);
  }, [address, abi, signerOrProvider]);
} 