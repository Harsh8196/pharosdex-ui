export interface Token {
  symbol: string;
  name: string;
  logoURI?: string;
  address: string;
  decimals: number;
}

export interface BribeData {
  token: Token;
  amount: bigint;
  userAmount: bigint;
}

export interface PoolData {
  pool: string;
  poolType: string;
  lpTokens: Token[];
  mintedLPTokens: bigint[];
  listedTokens: Token[];
  reserves: bigint[];
  logYield: bigint;
  poolParams: string;
}

export interface PoolDisplayData {
  id: number;
  address: string;
  token0: Token;
  token1: Token;
  tvl: string;
  poolamountToken0: string;
  poolamountToken1: string;
  apr: string;
  volume24h: string;
  fees24h: string;
  version: string;
}

export interface GaugeData {
  gauge: string;
  poolData: {
    pool: string;
    listedTokens: string[];
    reserves: bigint[];
    poolType: string;
    poolParams: string;
  };
  killed: boolean;
  totalVotes: bigint;
  userVotes: bigint;
  userClaimable: bigint;
  emissionRate: bigint;
  userEmissionRate: bigint;
  stakedValueInHubToken: bigint;
  userStakedValueInHubToken: bigint;
  averageInterestRatePerSecond: bigint;
  userInterestRatePerSecond: bigint;
  stakeableTokens: Token[];
  stakedAmounts: bigint[];
  userStakedAmounts: bigint[];
  underlyingTokens: Token[];
  stakedUnderlying: bigint[];
  userUnderlying: bigint[];
  bribes: BribeData[];
} 