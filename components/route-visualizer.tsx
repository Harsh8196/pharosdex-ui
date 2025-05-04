"use client"

interface RouteVisualizerProps {
  fromToken: any
  toToken: any
}

export default function RouteVisualizer({ fromToken, toToken }: RouteVisualizerProps) {
  // Simulate different routes
  const routes = [
    {
      percentage: 75,
      path: [fromToken, { symbol: "WETH", name: "Wrapped Ethereum", icon: "🔷" }, toToken],
      protocol: "Uniswap V3",
      fee: "0.05%",
    },
    {
      percentage: 25,
      path: [fromToken, toToken],
      protocol: "Curve",
      fee: "0.01%",
    },
  ]

  return (
    <div className="bg-black/40 rounded-md p-3 border border-white/10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Route</span>
        <span className="text-xs text-gray-500">Best price route automatically selected</span>
      </div>

      <div className="space-y-2">
        {routes.map((route, index) => (
          <div key={index} className="flex items-center">
            <div className="w-[30px] text-xs text-right mr-2">{route.percentage}%</div>
            <div className="flex-1 flex items-center">
              {route.path.map((token, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center text-xs">
                    {token.icon}
                  </div>
                  {i < route.path.length - 1 && <div className="mx-1 text-gray-500">→</div>}
                </div>
              ))}
              <div className="ml-2 text-xs">
                <span className="text-gray-400">{route.protocol}</span>
                <span className="ml-1 text-gray-500">({route.fee})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
