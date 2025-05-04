"use client"

export default function TokenTable() {
  const tokens = [
    { rank: 1, name: "Ethereum", symbol: "ETH", icon: "🔷", price: "$2,200.45", change: "+5.2%", volume: "$1.2B" },
    { rank: 2, name: "USD Coin", symbol: "USDC", icon: "💵", price: "$1.00", change: "+0.01%", volume: "$845M" },
    {
      rank: 3,
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      icon: "🔶",
      price: "$45,000.32",
      change: "+2.3%",
      volume: "$532M",
    },
    { rank: 4, name: "Dai Stablecoin", symbol: "DAI", icon: "🟡", price: "$1.00", change: "+0.02%", volume: "$423M" },
    { rank: 5, name: "Chainlink", symbol: "LINK", icon: "🔗", price: "$13.45", change: "-1.2%", volume: "$321M" },
    { rank: 6, name: "Uniswap", symbol: "UNI", icon: "🦄", price: "$5.32", change: "+3.4%", volume: "$245M" },
    { rank: 7, name: "Aave", symbol: "AAVE", icon: "👻", price: "$80.21", change: "+2.1%", volume: "$198M" },
    { rank: 8, name: "Synthetix", symbol: "SNX", icon: "⚡", price: "$2.54", change: "-0.8%", volume: "$156M" },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">#</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Token</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">24h</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Volume</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.symbol} className="border-b border-white/10 hover:bg-cyberpurple/10 transition-colors">
              <td className="py-3 px-4 text-sm">{token.rank}</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyberpink to-cyberblue flex items-center justify-center text-base mr-3">
                    {token.icon}
                  </div>
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="text-sm text-gray-400">{token.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right">{token.price}</td>
              <td
                className={`py-3 px-4 text-right ${token.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}
              >
                {token.change}
              </td>
              <td className="py-3 px-4 text-right">{token.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
