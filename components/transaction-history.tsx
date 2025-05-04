"use client"

export default function TransactionHistory() {
  const transactions = [
    {
      id: 1,
      type: "swap",
      from: { symbol: "ETH", amount: "0.5", icon: "🔷" },
      to: { symbol: "USDC", amount: "1,100", icon: "💵" },
      time: "10 mins ago",
      status: "confirmed",
    },
    {
      id: 2,
      type: "addLiquidity",
      from: { symbol: "ETH", amount: "1.2", icon: "🔷" },
      to: { symbol: "USDC", amount: "2,640", icon: "💵" },
      time: "2 hours ago",
      status: "confirmed",
    },
    {
      id: 3,
      type: "swap",
      from: { symbol: "USDC", amount: "500", icon: "💵" },
      to: { symbol: "WBTC", amount: "0.01", icon: "🔶" },
      time: "5 hours ago",
      status: "confirmed",
    },
    {
      id: 4,
      type: "removeLiquidity",
      from: { symbol: "ETH", amount: "0.3", icon: "🔷" },
      to: { symbol: "DAI", amount: "660", icon: "🟡" },
      time: "1 day ago",
      status: "confirmed",
    },
    {
      id: 5,
      type: "swap",
      from: { symbol: "LINK", amount: "25", icon: "🔗" },
      to: { symbol: "ETH", amount: "0.12", icon: "🔷" },
      time: "2 days ago",
      status: "confirmed",
    },
  ]

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "swap":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case "addLiquidity":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberblue to-cyberpink flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case "removeLiquidity":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "swap":
        return "Swap"
      case "addLiquidity":
        return "Add Liquidity"
      case "removeLiquidity":
        return "Remove Liquidity"
      default:
        return type
    }
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center p-3 bg-black/60 rounded-md border border-white/10 hover:border-cyberblue/30 transition-colors"
        >
          <div className="mr-3">{getTransactionIcon(tx.type)}</div>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium">{getTransactionLabel(tx.type)}</span>
              <span className="text-sm text-gray-400">{tx.time}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="flex items-center">
                <span className="mr-1">{tx.from.amount}</span>
                <span className="mr-1">{tx.from.icon}</span>
                <span className="mr-1">{tx.from.symbol}</span>
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-1"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="flex items-center">
                <span className="mr-1">{tx.to.amount}</span>
                <span className="mr-1">{tx.to.icon}</span>
                <span>{tx.to.symbol}</span>
              </span>
            </div>
          </div>
          <div className="ml-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
