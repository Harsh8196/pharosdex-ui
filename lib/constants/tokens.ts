export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance?: string;
  logoURI?: string;
}

export const SUPPORTED_TOKENS: Token[] = [
  {
    symbol: "PTT",
    name: "Pharos Token",
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    decimals: 18,
    balance: "0.0",
    logoURI: "https://docs.pharosnetwork.xyz/~gitbook/image?url=https%3A%2F%2F3467509822-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FKKJs3YcSFbFF0lrqt43f%252Fsites%252Fsite_l4IeK%252Ficon%252FkdvxtoO7c6VTNhdjG8PQ%252Fmark.png%3Falt%3Dmedia%26token%3D5ecfa4fd-78d8-4005-a06c-98df5c01ea50&width=32&dpr=2&quality=100&sign=8eb62a33&sv=2"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xE1B2057710A262F4aFb49636bCe05EE2b593f3b0",
    decimals: 18,
    balance: "0.0",
    logoURI: "https://www.cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040"
  },
  {
    symbol: "PHAS",
    name: "Pharos Swap PHAS",
    address: "0x716e5aa44BC37c54C7dc9427Ef4344AB5EA3a967",
    decimals: 18,
    balance: "0.0",
    logoURI: "https://docs.pharosnetwork.xyz/~gitbook/image?url=https%3A%2F%2F3467509822-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FKKJs3YcSFbFF0lrqt43f%252Fsites%252Fsite_l4IeK%252Ficon%252FkdvxtoO7c6VTNhdjG8PQ%252Fmark.png%3Falt%3Dmedia%26token%3D5ecfa4fd-78d8-4005-a06c-98df5c01ea50&width=32&dpr=2&quality=100&sign=8eb62a33&sv=2"
  },
  {
    symbol: "vePHAS",
    name: "Pharos Swap vePHAS",
    address: "0x5E338E6b8Cab4EC02f636919AFB990c0CE7089E8",
    decimals: 18,
    balance: "0.0",
    logoURI: "https://docs.pharosnetwork.xyz/~gitbook/image?url=https%3A%2F%2F3467509822-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FKKJs3YcSFbFF0lrqt43f%252Fsites%252Fsite_l4IeK%252Ficon%252FkdvxtoO7c6VTNhdjG8PQ%252Fmark.png%3Falt%3Dmedia%26token%3D5ecfa4fd-78d8-4005-a06c-98df5c01ea50&width=32&dpr=2&quality=100&sign=8eb62a33&sv=2"
  }
] 