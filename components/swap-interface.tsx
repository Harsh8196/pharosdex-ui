"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWalletStore } from "@/lib/stores/wallet-store"
import { useState, useEffect, useCallback } from "react"
import TokenSelector from "./token-selector"
import { ArrowDown, Settings, Info, BarChart3, ArrowRight } from "lucide-react"
import PriceChart from "./price-chart"
import RouteVisualizer from "./route-visualizer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast, Toaster } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { SUPPORTED_TOKENS, Token } from "@/lib/constants/tokens"
import { checkPoolExists, getQuote, TokenWithDecimals } from "@/lib/contracts/swapHelpers"
import { formatUnits, parseUnits } from "viem"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Input as UiInput } from "@/components/ui/input"
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses"
import IVaultABI from "@/lib/contracts/abis/IVault.json"
import ERC20ABI from '@/lib/contracts/abis/ERC20.json'
import { getAdjustedGasEstimate } from '@/lib/contracts/contractUtils'

// Helper to format token amounts using the correct decimals
function formatTokenAmount(amount: bigint, token: Token) {
  return formatUnits(amount, token.decimals);
}

export default function SwapInterface() {
  const {
    address,
    isConnected,
    isWrongNetwork,
    tokenBalances,
    updateAllBalances,
    isLoading,
    chainId,
    publicClient,
    walletClient,
    connectWallet
  } = useWalletStore()

  useEffect(() => {
    if(!walletClient?.account){
      connectWallet()
    }
  }, [walletClient])

  // Debug wallet state
  useEffect(() => {
    // Remove debug logging
  }, [isConnected, isLoading, address, isWrongNetwork])

  // Update balances when connection state changes - with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isConnected && !isLoading && address) {
      timeoutId = setTimeout(() => {
        updateAllBalances()
      }, 1000) // 1 second debounce
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isConnected, isLoading, address, updateAllBalances])

  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [slippage, setSlippage] = useState("0.1")
  const [customSlippage, setCustomSlippage] = useState(false)
  const [gasPrice, setGasPrice] = useState("12.4")
  const [priceImpact, setPriceImpact] = useState("0.12")
  const [isSwapLoading, setIsSwapLoading] = useState(false)

  // Add state for swap details
  const [swapDetails, setSwapDetails] = useState<null | {
    priceImpact: number,
    minReceived: string,
    slippage: string,
    networkFee: string,
    route: Array<{
      percent: number,
      path: string[],
      type: string
    }>
  }>(null);

  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [networkFee, setNetworkFee] = useState<string>("-");

  // Check for pool existence when tokens change
  useEffect(() => {
    setPoolAddress(null);
    setQuoteError(null);
    setSwapDetails(null);
    setToAmount("");
    if (fromToken && toToken && publicClient) {
      checkPoolExists({ client: publicClient, tokenA: fromToken as TokenWithDecimals, tokenB: toToken as TokenWithDecimals })
        .then((pool) => {
          if (!pool) {
            setQuoteError("No pool found for this pair.");
            toast({ title: "No pool found for this pair.", variant: "destructive" });
            setPoolAddress(null);
          } else {
            setPoolAddress(pool as string);
            setQuoteError(null);
          }
        })
        .catch((err) => {
          setQuoteError("Error checking pool.");
        });
    }
  }, [fromToken, toToken, publicClient]);

  // Fetch quote when all dependencies are set
  useEffect(() => {
    const fetchQuote = async () => {
      setToAmount("");
      setSwapDetails(null);
      setNetworkFee("-");
      if (
        fromToken &&
        toToken &&
        fromAmount &&
        publicClient
      ) {
        try {
          const amounts = await getQuote({
            client: publicClient,
            fromToken: fromToken as TokenWithDecimals,
            toToken: toToken as TokenWithDecimals,
            amountIn: fromAmount,
            stable: false,
          }) as bigint[];
          const toAmt = formatTokenAmount(amounts[1], toToken);
          setToAmount(toAmt);
          // Estimate gas and fee
          let fn: string;
          let args: any[];
          const path = [{ from: fromToken.address, to: toToken.address, stable: false }];
          const parsedAmountIn = BigInt(parseUnits(fromAmount, fromToken.decimals).toString());
          const minReceived = toAmt && slippage ? (BigInt(parseUnits(toAmt, toToken.decimals).toString()) * BigInt(10000 - Math.floor(parseFloat(slippage) * 100))) / 10000n : 0n;
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes
          if (fromToken.symbol === "PTT") {
            fn = "swapExactETHForTokens";
            args = [minReceived, path, address, deadline];
          } else if (toToken.symbol === "PTT") {
            fn = "swapExactTokensForETH";
            args = [parsedAmountIn, minReceived, path, address, deadline];
          } else {
            fn = "swapExactTokensForTokens";
            args = [parsedAmountIn, minReceived, path, address, deadline];
          }
          let value = 0n;
          if (fromToken.symbol === "PTT") {
            value = parsedAmountIn;
          }
          try {
            const gasEstimate = await publicClient.estimateGas({
              account: address as `0x${string}`,
              to: CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`,
              abi: IVaultABI,
              functionName: fn,
              args,
              value,
            });
            const gasPriceEstimate = await publicClient.getGasPrice();
            const fee = BigInt(gasEstimate) * BigInt(gasPriceEstimate);
            setNetworkFee(formatUnits(fee, 18));
          } catch (e) {
            setNetworkFee("-");
          }
          setSwapDetails({
            priceImpact: 0,
            minReceived: toAmt,
            slippage: slippage,
            networkFee: networkFee,
            route: [
              { percent: 100, path: [fromToken.symbol, toToken.symbol], type: "Volatile" }
            ]
          });
          setQuoteError(null);
        } catch (e) {
          setQuoteError("Failed to fetch quote");
          setSwapDetails(null);
          setToAmount("");
          setNetworkFee("-");
          toast({ title: "Failed to fetch quote", variant: "destructive" });
        }
      } else {
        setSwapDetails(null);
        setToAmount("");
        setNetworkFee("-");
      }
    };
    fetchQuote();
  }, [fromAmount, fromToken, toToken, poolAddress, publicClient]);

  // Memoize token balance getter
  const getTokenBalance = useCallback((symbol: string) => {
    if (!isConnected || isLoading) return "0"
    return tokenBalances[symbol] || "0"
  }, [isConnected, isLoading, tokenBalances])

  const handleFromTokenSelect = useCallback((token: Token) => {
    setFromToken(token)
  }, [])

  const handleToTokenSelect = useCallback((token: Token) => {
    setToToken(token)
  }, [])

  // Remove quote logic from handleFromAmountChange
  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value);
  }, []);

  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }, [fromToken, toToken, fromAmount, toAmount])

  const handleSwap = useCallback(async () => {
    console.log('Swap attempt:', {
      isConnected,
      walletClient: !!walletClient,
      hasAccount: !!walletClient?.account,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      address
    })

    if (!isConnected || !walletClient?.account || !fromToken || !toToken || !fromAmount || !toAmount || !address) {
      toast({
        title: "Cannot execute swap",
        description: "Please check your wallet connection and token selection",
        variant: "destructive",
      });
      return;
    }

    setIsSwapLoading(true);
    try {
      // Validate slippage
      const slippageValue = parseFloat(slippage);
      if (isNaN(slippageValue) || slippageValue < 0.01 || slippageValue > 50) {
        toast({
          title: "Invalid slippage",
          description: "Please enter a slippage between 0.01% and 50%.",
          variant: "destructive",
        });
        setIsSwapLoading(false);
        return;
      }

      // Prepare swap parameters
      const fromTokenDecimals = fromToken.symbol === 'USDC' ? 18 : fromToken.decimals;
      const toTokenDecimals = toToken.symbol === 'USDC' ? 18 : toToken.decimals;
      const path = [{ from: fromToken.address, to: toToken.address, stable: false }];
      const parsedAmountIn = fromAmount && !isNaN(Number(fromAmount))
        ? BigInt(parseUnits(fromAmount, fromTokenDecimals).toString())
        : 0n;
      const INT128_MAX = BigInt("170141183460469231731687303715884105727");
      if (parsedAmountIn > INT128_MAX) {
        toast({
          title: "Amount too large",
          description: "The amount exceeds the maximum allowed by the protocol.",
          variant: "destructive",
        });
        setIsSwapLoading(false);
        return;
      }
      const minReceived = toAmount && slippage ? 
        (BigInt(parseUnits(toAmount, toTokenDecimals).toString()) * BigInt(10000 - Math.floor(parseFloat(slippage) * 100))) / 10000n : 
        0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

      // --- ERC20 Approval Logic ---
      if (fromToken.symbol !== 'PTT') {
        // Check allowance
        const allowance = await publicClient.readContract({
          address: fromToken.address as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`],
        });
        if (BigInt(allowance) < parsedAmountIn) {
          // Approve only the exact amount needed
          const approveParams = {
            address: fromToken.address as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`, parsedAmountIn],
            account: walletClient.account
          };
          const approveGas = await getAdjustedGasEstimate(publicClient, walletClient, approveParams);
          const approveTx = await walletClient.writeContract({
            ...approveParams,
            gas: approveGas,
          });
          // Wait for approval to be mined
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
      }
      // --- End ERC20 Approval Logic ---

      // Determine which swap function to use
      let hash;
      if (fromToken.symbol === "PTT") {
        // swapExactETHForTokens
        const value = parsedAmountIn;
        const swapParams = {
          address: CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`,
          abi: IVaultABI,
          functionName: 'swapExactETHForTokens',
          args: [minReceived, path, address, deadline],
          value,
        };
        const swapGas = await getAdjustedGasEstimate(publicClient, walletClient, swapParams);
        hash = await walletClient.writeContract({
          ...swapParams,
          account: address as `0x${string}`,
          gas: swapGas,
        });
      } else if (toToken.symbol === "PTT") {
        // swapExactTokensForETH
        const swapParams = {
          address: CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`,
          abi: IVaultABI,
          functionName: 'swapExactTokensForETH',
          args: [parsedAmountIn, minReceived, path, address, deadline],
        };
        const swapGas = await getAdjustedGasEstimate(publicClient, walletClient, swapParams);
        hash = await walletClient.writeContract({
          ...swapParams,
          account: address as `0x${string}`,
          gas: swapGas,
        });
      } else {
        // swapExactTokensForTokens
        const swapParams = {
          address: CONTRACT_ADDRESSES.mainnet.IVault as `0x${string}`,
          abi: IVaultABI,
          functionName: 'swapExactTokensForTokens',
          args: [parsedAmountIn, minReceived, path, address, deadline],
        };
        const swapGas = await getAdjustedGasEstimate(publicClient, walletClient, swapParams);
        hash = await walletClient.writeContract({
          ...swapParams,
          account: address as `0x${string}`,
          gas: swapGas,
        });
      }

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        toast({
          title: "Swap Successful",
          description: `Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
        });
        // Update balances after successful swap
        await updateAllBalances();
        // Reset form
        setFromAmount("");
        setToAmount("");
        setSwapDetails(null);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Failed to complete the swap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapLoading(false);
    }
  }, [isConnected, walletClient, fromToken, toToken, fromAmount, toAmount, address, slippage, publicClient, updateAllBalances]);

  const getButtonText = useCallback(() => {
    if (!isConnected) return "Connect Wallet"
    if (isLoading || isSwapLoading) return "Loading..."
    if (!fromToken || !toToken) return "Select Tokens"
    if (!fromAmount) return "Enter Amount"
    return "Swap"
  }, [isConnected, isLoading, isSwapLoading, fromToken, toToken, fromAmount])

  const handlePercentageSelect = useCallback((percentage: number) => {
    if (!fromToken) return;
    const balance = parseFloat(getTokenBalance(fromToken.symbol));
    const amount = (balance * percentage / 100).toString();
    handleFromAmountChange(amount);
  }, [fromToken, getTokenBalance, handleFromAmountChange]);

  // Calculate min received based on slippage
  const minReceived = useCallback(() => {
    if (!toAmount) return "0";
    const slippagePercent = parseFloat(slippage) / 100;
    const min = parseFloat(toAmount) * (1 - slippagePercent);
    // Use toTokenDecimals for formatting
    return min.toFixed(toToken ? (toToken.symbol === 'USDC' ? 18 : toToken.decimals) : 6);
  }, [toAmount, slippage, toToken]);

  // When slippage changes, update swap details
  useEffect(() => {
    if (swapDetails && toAmount) {
      try {
        // Ensure slippage is a valid number
        const slippageValue = parseFloat(slippage);
        if (isNaN(slippageValue) || slippageValue < 0.01 || slippageValue > 50) {
          console.error("Invalid slippage value:", slippage);
          toast({
            title: "Invalid Slippage",
            description: `Slippage should be under this range: 0.1% - 5%`,
          });
          return;
        }
        
        setSwapDetails({
          ...swapDetails,
          minReceived: minReceived(),
          slippage: slippage,
        });
      } catch (error) {
        console.error("Error updating swap details:", error);
      }
    }
  }, [slippage, toAmount]);

  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false);
  const [showToTokenSelector, setShowToTokenSelector] = useState(false);

  return (
    <div className="space-y-4">
      <Toaster />
      <div className="cyberpunk-card animated-gradient-border p-5">
        <div className="flex justify-between items-center mb-4">
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="bg-black/40 border border-white/10">
              <TabsTrigger
                value="swap"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
              >
                Swap
              </TabsTrigger>
              {/* <TabsTrigger
                value="limit"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
              >
                Limit
              </TabsTrigger> */}
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={() => setShowChart(!showChart)}
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Price Chart</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {showChart && (
          <div className="mb-4">
            <PriceChart fromToken={fromToken} toToken={toToken} />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>From</Label>
              {fromToken && (
                <span className="text-sm text-muted-foreground">
                  Balance: {getTokenBalance(fromToken.symbol)} {fromToken.symbol}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <TokenSelector
                selectedToken={fromToken}
                onSelect={(token) => {
                  setFromToken(token);
                  setShowFromTokenSelector(false);
                }}
                excludedToken={toToken?.symbol}
                getTokenBalance={getTokenBalance}
                isOpen={showFromTokenSelector}
                onClose={() => setShowFromTokenSelector(false)}
                onClick={() => setShowFromTokenSelector(true)}
              />
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className="flex-1"
              />
            </div>
            {fromToken && (
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageSelect(25)}
                  className="flex-1"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageSelect(50)}
                  className="flex-1"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageSelect(75)}
                  className="flex-1"
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageSelect(100)}
                  className="flex-1"
                >
                  100%
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapTokens}
              className="rounded-full bg-black/40 hover:bg-black/60"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>To</Label>
              {toToken && (
                <span className="text-sm text-muted-foreground">
                  Balance: {getTokenBalance(toToken.symbol)} {toToken.symbol}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <TokenSelector
                selectedToken={toToken}
                onSelect={(token) => {
                  setToToken(token);
                  setShowToTokenSelector(false);
                }}
                excludedToken={fromToken?.symbol}
                getTokenBalance={getTokenBalance}
                isOpen={showToTokenSelector}
                onClose={() => setShowToTokenSelector(false)}
                onClick={() => setShowToTokenSelector(true)}
              />
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="flex-1"
              />
            </div>
          </div>

          {/* Swap Details and Route Info */}
          {swapDetails && (
            <div className="bg-[#181A1B] rounded-xl p-4 mt-4 shadow-lg border border-[#232627]">
              {/* Swap Summary */}
              <div className="flex items-center gap-2 mb-4">
                {fromToken && (
                  <span className="flex items-center gap-1 font-bold">
                    {fromToken.logoURI && (
                      <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-5 h-5 rounded-full" />
                    )}
                    {fromAmount} {fromToken.symbol}
                  </span>
                )}
                <span className="mx-2 text-cyberblue-400 text-lg">
                  <ArrowRight className="inline w-5 h-5"/>
                </span>
                {toToken && (
                  <span className="flex items-center gap-1 font-bold">
                    {toToken.logoURI && (
                      <img src={toToken.logoURI} alt={toToken.symbol} className="w-5 h-5 rounded-full" />
                    )}
                    {toAmount} {toToken.symbol}
                  </span>
                )}
              </div>
              <div className="border-b border-[#232627] mb-3"></div>
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-2">
                <div>Price Impact</div>
                <div>
                  <span className={`px-2 py-1 rounded font-bold ${swapDetails.priceImpact > 1 ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400'}`}>
                    {swapDetails.priceImpact} %
                  </span>
                </div>
                <div>Min Received</div>
                <div className="font-bold text-cyberblue-200">
                  {swapDetails.minReceived ? formatUnits(BigInt(parseUnits(swapDetails.minReceived, toToken ? (toToken.symbol === 'USDC' ? 18 : toToken.decimals) : 18).toString()), toToken ? (toToken.symbol === 'USDC' ? 18 : toToken.decimals) : 18) : '0'} {toToken?.symbol}
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium mb-2 block">Slippage Tolerance</Label>
                  <RadioGroup value={slippage} onValueChange={val => { setSlippage(val); setCustomSlippage(val === 'custom'); }} className="flex flex-wrap gap-2 mb-2">
                    {["0.1", "0.5", "1.0"].map(val => (
                      <div className="flex items-center" key={val}>
                        <RadioGroupItem value={val} id={`slippage-${val}`} className="sr-only" />
                        <Label
                          htmlFor={`slippage-${val}`}
                          className={`px-3 py-1 rounded-md cursor-pointer ${slippage === val ? "bg-gradient-to-r from-cyberpink to-cyberblue text-white" : "bg-black/60 hover:bg-cyberpurple/30 border border-white/10"}`}
                        >
                          {val}%
                        </Label>
                      </div>
                    ))}
                    <div className="flex items-center">
                      <RadioGroupItem value="custom" id="slippage-custom" className="sr-only" />
                      <Label
                        htmlFor="slippage-custom"
                        className={`px-3 py-1 rounded-md cursor-pointer ${customSlippage ? "bg-gradient-to-r from-cyberpink to-cyberblue text-white" : "bg-black/60 hover:bg-cyberpurple/30 border border-white/10"}`}
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
                        onValueChange={val => {
                          try {
                            const newValue = val[0].toString();
                            setSlippage(newValue);
                          } catch (error) {
                            console.error("Error setting slippage from slider:", error);
                          }
                        }}
                        className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyberpink [&_[role=slider]]:to-cyberblue [&_[role=slider]]:border-none"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0.1%</span>
                        <span>5%</span>
                      </div>
                      <div className="flex items-center">
                        <UiInput
                          type="number"
                          value={slippage}
                          onChange={e => {
                            try {
                              const value = e.target.value;
                              // Validate the input
                              const numValue = parseFloat(value);
                              if (isNaN(numValue) || numValue < 0.01 || numValue > 50) {
                                return; // Don't update if invalid
                              }
                              setSlippage(value);
                            } catch (error) {
                              console.error("Error setting slippage from input:", error);
                            }
                          }}
                          className="w-20 mr-2 bg-black/60 border-white/10"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>Network Fee</div>
                <div className="text-muted-foreground">{networkFee} PTT</div>
              </div>
              <div className="border-b border-[#232627] my-3"></div>
              {/* Route Section */}
              <div className="mt-2">
                <div className="font-bold mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyberblue-400" />
                  Route
                </div>
                <div className="bg-[#232627] rounded-lg p-3">
                  {swapDetails.route.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <span className="bg-cyberblue-900 text-cyberblue-200 px-2 py-1 rounded font-semibold">{r.percent}%</span>
                      <span className="flex items-center gap-1">
                        {r.path.map((p, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="font-medium">{p}</span>
                            {i < r.path.length - 1 && (
                              <span className="text-cyberpink-200">
                                <ArrowRight className="inline w-4 h-4" />
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                      <span className="ml-2 text-xs bg-[#181A1B] px-2 py-1 rounded border border-[#232627] text-cyberpink-200">{r.type}</span>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground mt-2">
                    The router optimizes the output of your trade by considering hops and split routes.
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSwap}
            disabled={!isConnected || isLoading || isSwapLoading || !fromToken || !toToken || !fromAmount}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  )
}
