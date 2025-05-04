"use client"

import { useState, useMemo, useEffect } from "react";
import { usePoolData } from "@/hooks/usePoolData";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUnits, parseUnits } from "viem";
import ERC20ABI from "@/lib/contracts/abis/ERC20.json";
import { SUPPORTED_TOKENS } from "@/lib/constants/tokens";
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import IVaultABI from '@/lib/contracts/abis/IVault.json';
import { getAdjustedGasEstimate } from '@/lib/contracts/contractUtils';
import { toast } from '@/components/ui/use-toast';

interface VoteComponentProps {
  totalVotingPower: number;
}

const VOTE_OP_TYPE = 3; // Velocore Vote opType
const EXACTLY = 0;
const AT_MOST = 1;

// Helper: encode address as bytes32 (Token)
function toToken(address: string): `0x${string}` {
  return `0x${address.replace(/^0x/, '').padStart(64, '0')}` as `0x${string}`;
}
// Helper: encode poolId (opType + pool address)
function toPoolId(opType: number, pool: string): `0x${string}` {
  return `0x${opType.toString(16).padStart(2, '0')}${'0'.repeat(22)}${pool.replace(/^0x/, '')}` as `0x${string}`;
}
// Helper: encode tokenInfo (index, method, amount)
function toTokenInfo(index: number, method: number, amount: bigint): `0x${string}` {
  const indexHex = index.toString(16).padStart(2, '0');
  const methodHex = method.toString(16).padStart(2, '0');
  const zeros = '0'.repeat(28);
  let amountHex = (amount >= 0n ? amount : (1n << 128n) + amount).toString(16).padStart(32, '0');
  return `0x${indexHex}${methodHex}${zeros}${amountHex}` as `0x${string}`;
}

export default function VoteComponent({ totalVotingPower }: VoteComponentProps) {
  const { pools, loading } = usePoolData();
  const { isConnected, address, connectWallet, publicClient, walletClient } = useWalletStore();
  // Store both the raw string and parsed number for each pool
  const [votes, setVotes] = useState<{ [poolId: string]: { raw: string; value: number } }>({});
  const [totalVePhasBalance, setTotalVePhasBalance] = useState<string>("0");
  const [remainingVePhasBalance, setRemainingVePhasBalance] = useState<string>("0");
  const [phasLockAmount, setPhasLockAmount] = useState<string>("");
  const [isLocking, setIsLocking] = useState(false);

  // Get vePHAS token address
  const vePhasToken = SUPPORTED_TOKENS.find(token => token.symbol === "vePHAS");
  const vePhasAddress = vePhasToken?.address as `0x${string}`;
  const phasToken = SUPPORTED_TOKENS.find(token => token.symbol === "PHAS");
  const phasAddress = phasToken?.address as `0x${string}`;

  useEffect(() => {
    if(!walletClient?.account){
      connectWallet()
    }
  }, [walletClient])

  // Fetch vePHAS balance
  useEffect(() => {
    const fetchVePhasBalance = async () => {
      if (!isConnected || !address) return;
      try {
        const balance = await publicClient.readContract({
          address: vePhasAddress,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        }) as bigint;

        setTotalVePhasBalance(formatUnits(balance, 18));
      } catch (error) {
        console.error(`Error fetching vePHAS balance:`, error);
      }
    };

    fetchVePhasBalance();
  }, [isConnected, address, publicClient, vePhasAddress]);

  // Calculate remaining voting power and vePHAS balance
  const usedVotingPower = useMemo(
    () => Object.values(votes).reduce((a, b) => a + (isNaN(b.value) ? 0 : b.value), 0),
    [votes]
  );
  const remainingVotingPower = Math.max(0, totalVotingPower - usedVotingPower);

  // Calculate remaining vePHAS balance
  useEffect(() => {
    const totalVePhas = parseFloat(totalVePhasBalance);
    if (isNaN(totalVePhas)) return;

    const usedVePhas = Object.entries(votes).reduce((total, [poolId, { value }]) => {
      const pool = pools.find(p => String(p.id) === poolId);
      if (!pool) return total;
      
      const currentVotes = parseFloat(formatUnits(pool.userVotes, 18));
      const newVotes = (value / 100) * totalVePhas;
      return total + (newVotes - currentVotes);
    }, 0);

    const remaining = Math.max(0, totalVePhas - usedVePhas);
    setRemainingVePhasBalance(remaining.toFixed(2));
  }, [votes, totalVePhasBalance, pools]);

  // Handle vote input
  const handleVoteChange = (poolId: string, raw: string) => {
    setVotes((prev) => ({
      ...prev,
      [poolId]: {
        raw,
        value: prev[poolId]?.value ?? 0,
      },
    }));
  };

  // On blur, parse and clamp
  const handleVoteBlur = (poolId: string) => {
    setVotes((prev) => {
      const raw = prev[poolId]?.raw || "";
      let num = parseFloat(raw);
      if (isNaN(num) || num < 0) num = 0;
      if (num > 100) num = 100;
      return {
        ...prev,
        [poolId]: {
          raw: num === 0 ? "" : num.toString(),
          value: num,
        },
      };
    });
  };

  // Set max for a pool
  const handleMax = (poolId: string) => {
    const max = Math.min(100, remainingVotingPower);
    setVotes((prev) => ({
      ...prev,
      [poolId]: {
        raw: max.toString(),
        value: max,
      },
    }));
  };

  // Submit votes (convert percentages to veToken amounts)
  const handleSubmit = async () => {
    if (!isConnected || !address || !publicClient || !vePhasAddress || !walletClient) return;
    try {
      // 1. Prepare voting data
      const totalVePhas = parseUnits(totalVePhasBalance, 18);
      const ops = Object.entries(votes)
        .map(([poolId, { value }]) => {
          const pool = pools.find(p => String(p.id) === poolId);
          if (!pool) return null;
          const currentVote = parseFloat(formatUnits(pool.userVotes, 18));
          const newVote = (value / 100) * parseFloat(totalVePhasBalance);
          console.log('poolId:', poolId);
          console.log('currentVote:', currentVote);
          console.log('newVote:', newVote);
          const delta = newVote - currentVote;
          console.log('delta:', delta);
          if (Math.abs(delta) < 1e-12) return null; // skip if no change
          const deltaInt = parseUnits(delta.toString(), 18);
          console.log('deltaInt:', deltaInt);
          return {
            poolId: toPoolId(VOTE_OP_TYPE, pool.address),
            tokenInformations: [toTokenInfo(0, EXACTLY, deltaInt)],
            data: '0x',
          };
        })
        .filter(Boolean);
      if (ops.length === 0) {
        toast({ title: "No vote changes to submit", variant: "destructive" });
        return;
      }
      // 2. Prepare tokens array (only vePHAS)
      const tokens = [toToken(vePhasAddress)];
      // 3. Prepare deposit array (int128[]), only vePHAS, 0 for voting
      const deposits = [0n];
      // Debug log
      console.log('Voting payload:', { tokens, deposits, ops });
      // 4. Check vePHAS allowance for Vault
      const vaultAddress = CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`;
      const allowance = await publicClient.readContract({
        address: vePhasAddress,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, vaultAddress]
      }) as bigint;
      const totalVoteAmount = ops.reduce((sum, op) => sum + BigInt(op!.tokenInformations[0]), 0n);
      if (allowance < totalVoteAmount) {
        // Approve Vault for max amount
        const approveParams = {
          address: vePhasAddress,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [vaultAddress, totalVoteAmount],
          account: address as `0x${string}`,
        };
        const approveGas = await getAdjustedGasEstimate(publicClient, walletClient, approveParams);
        const approveHash = await walletClient.writeContract({
          ...approveParams,
          gas: approveGas,
        });
        toast({ title: "Approving vePHAS for voting..." });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }
      // 5. Call execute on Vault
      const executeParams = {
        address: vaultAddress,
        abi: IVaultABI,
        functionName: 'execute',
        args: [tokens, deposits, ops],
        account: address as `0x${string}`,
      };
      const executeGas = await getAdjustedGasEstimate(publicClient, walletClient, executeParams);
      const hash = await walletClient.writeContract({
        ...executeParams,
        gas: executeGas,
      });
      toast({ title: "Voting transaction sent!", description: `Tx: ${hash}` });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);
      toast({ title: "Votes submitted!", variant: "default" });
    } catch (error: any) {
      toast({ title: "Voting failed", description: error?.message || String(error), variant: "destructive" });
      console.error("Voting error:", error);
    }
  };

  // Lock PHAS for vePHAS
  const handleLockPhas = async () => {
    if (!isConnected || !address || !publicClient || !walletClient || !phasAddress || !vePhasAddress) return;
    try {
      setIsLocking(true);
      const vaultAddress = CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`;
      const amountToLock = parseUnits(phasLockAmount, 18);
      // 1. Check PHAS allowance for Vault
      const allowance = await publicClient.readContract({
        address: phasAddress,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, vaultAddress]
      }) as bigint;
      if (allowance < amountToLock) {
        // Approve Vault for amount
        const approveParams = {
          address: phasAddress,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [vaultAddress, amountToLock],
          account: address as `0x${string}`,
        };
        const approveGas = await getAdjustedGasEstimate(publicClient, walletClient, approveParams);
        const approveHash = await walletClient.writeContract({
          ...approveParams,
          gas: approveGas,
        });
        toast({ title: "Approving PHAS for locking..." });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }
      // 2. Prepare lock op
      const tokens = [toToken(phasAddress), toToken(vePhasAddress)];
      const deposits = [0n, 0n];
      const ops = [{
        poolId: toPoolId(0, vePhasAddress),
        tokenInformations: [
          toTokenInfo(0, EXACTLY, amountToLock), // PHAS, exactly, amount
          toTokenInfo(1, AT_MOST, 0n),           // vePHAS, at most, 0
        ],
        data: '0x',
      }];
      // 3. Call execute on Vault
      const executeParams = {
        address: vaultAddress,
        abi: IVaultABI,
        functionName: 'execute',
        args: [tokens, deposits, ops],
        account: address as `0x${string}`,
      };
      const executeGas = await getAdjustedGasEstimate(publicClient, walletClient, executeParams);
      const hash = await walletClient.writeContract({
        ...executeParams,
        gas: executeGas,
      });
      toast({ title: "Locking PHAS...", description: `Tx: ${hash}` });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Lock PHAS receipt:', receipt);
      toast({ title: "PHAS locked! You now have vePHAS.", variant: "default" });
      setPhasLockAmount("");
      // Refresh vePHAS balance
      const balance = await publicClient.readContract({
        address: vePhasAddress,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }) as bigint;
      setTotalVePhasBalance(formatUnits(balance, 18));
    } catch (error: any) {
      toast({ title: "Locking PHAS failed", description: error?.message || String(error), variant: "destructive" });
      console.error("Locking PHAS error:", error);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="cyberpunk-card animated-gradient-border p-6">
      {/* PHAS Locking Section */}
      <div className="mb-6 p-4 bg-cyberblue-950/40 rounded-lg">
        <h2 className="text-lg font-bold mb-2 text-cyberblue-200">Lock PHAS for vePHAS</h2>
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="number"
            min={0}
            step="0.000000000000000001"
            value={phasLockAmount}
            onChange={e => setPhasLockAmount(e.target.value)}
            className="w-32 bg-black/60 border-white/10 text-white"
            placeholder="Amount to lock"
            disabled={!isConnected || isLocking}
          />
          <Button
            onClick={handleLockPhas}
            disabled={!isConnected || isLocking || !phasLockAmount || parseFloat(phasLockAmount) <= 0}
            className="bg-gradient-to-r from-cyberpink to-cyberblue text-white"
          >
            {isLocking ? 'Locking...' : 'Lock PHAS'}
          </Button>
        </div>
        <div className="text-xs text-cyberblue-200">You must lock PHAS to get vePHAS before voting.</div>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-cyberblue-200">Pool Voting</h1>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-semibold text-cyberpink">Voting Power:</span> <span className="text-white">{totalVotingPower} %</span>
          <br/>
          <span className="font-semibold text-cyberpink">Balance:</span> <span className="text-white">{totalVePhasBalance} vePHAS</span>
        </div>
        <div>
          <span className="font-semibold text-cyberblue-400">Remaining:</span> <span className="text-white">{remainingVotingPower} %</span>
          <br/>
          <span className="font-semibold text-cyberpink">Balance:</span> <span className="text-white">{remainingVePhasBalance} vePHAS</span>
        </div>
        {!isConnected && (
          <Button onClick={connectWallet} className="bg-gradient-to-r from-cyberpink to-cyberblue text-white">Connect Wallet</Button>
        )}
      </div>
      {/* Only enable voting if vePHAS balance > 0 */}
      {parseFloat(totalVePhasBalance) <= 0 && (
        <div className="mb-4 p-3 bg-cyberpink/10 text-cyberpink rounded">You must lock PHAS to get vePHAS before voting.</div>
      )}
      <div className="grid grid-cols-5 bg-gradient-to-r from-cyberpink/10 to-cyberblue/10 p-2 font-semibold text-cyberblue-200">
        <div>Pool</div>
        <div>TVL</div>
        <div>APR</div>
        <div>My Vote</div>
        <div>Cast Vote (%)</div>
      </div>
      {loading ? (
        <div className="p-4 text-center text-cyberpink">Loading pools...</div>
      ) : (
        pools.map((pool) => (
          <div
            key={pool.id}
            className="grid grid-cols-5 items-center border-t border-white/5 p-2 gap-2 hover:bg-cyberblue/5 transition"
          >
            <div className="flex items-center gap-2">
              {pool.token0.logoURI && (
                <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-5 h-5 rounded-full" />
              )}
              {pool.token1.logoURI && (
                <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-5 h-5 rounded-full" />
              )}
              <span className="text-white">{pool.token0.symbol}/{pool.token1.symbol}</span>
            </div>
            <div className="text-cyberblue-100">${pool.tvl}</div>
            <div className="text-cybergreen-200">{pool.apr}</div>
            <div className="text-cyberblue-200">
              {pool.userVotes ? formatUnits(pool.userVotes, 18) : "0"}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.000000000000000000"
                  value={votes[String(pool.id)]?.raw ?? ""}
                  onChange={(e) => handleVoteChange(String(pool.id), e.target.value)}
                  onBlur={() => handleVoteBlur(String(pool.id))}
                  className="w-20 bg-black/60 border-white/10 text-white"
                  disabled={!isConnected || parseFloat(totalVePhasBalance) <= 0}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMax(String(pool.id))}
                  disabled={!isConnected || remainingVotingPower <= 0 || parseFloat(totalVePhasBalance) <= 0}
                  className="border-cyberblue-400 text-cyberblue-200"
                >
                  MAX
                </Button>
              </div>
              {/* Show vePHAS for this vote */}
              <div className="text-xs text-cyberblue-200">
                {(() => {
                  const percent = votes[String(pool.id)]?.value || 0;
                  const totalVePhas = parseFloat(totalVePhasBalance);
                  if (isNaN(percent) || isNaN(totalVePhas)) return null;
                  const vePhasForVote = (percent / 100) * totalVePhas;
                  return `vePHAS for this vote: ${vePhasForVote.toFixed(6)}`;
                })()}
              </div>
            </div>
          </div>
        ))
      )}
      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit}
          disabled={true}
          className="w-full bg-gradient-to-r from-cyberpink to-cyberblue text-white py-3 text-lg font-semibold"
        >
          Submit Votes (Coming Soon)
        </Button>
      </div>
    </div>
  );
} 