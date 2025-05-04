import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="text-center max-w-3xl mx-auto relative">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyberpink/20 rounded-full filter blur-3xl animate-pulse-glow"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyberblue/20 rounded-full filter blur-3xl animate-pulse-glow"></div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyberpink via-cyberblue to-cyberpink animate-gradient-flow">
          PHAROS<span className="text-white">SWAP</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 font-light">SLICING THROUGH THE COMPLEXITY OF DEFI</p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            asChild
            className="animated-gradient-border bg-cyberdark hover:bg-cyberdark/80 text-white px-8 py-6 text-lg"
          >
            <Link href="/swap">LAUNCH APP</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-cyberblue/50 text-cyberblue hover:bg-cyberblue/10 px-8 py-6 text-lg"
          >
            <Link href="/dashboard">DASHBOARD</Link>
          </Button>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="cyberpunk-card p-6 glow-effect">
          <div className="w-12 h-12 mb-4 rounded bg-gradient-to-br from-cyberpink to-cyberblue flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">INSTANT SWAPS</h3>
          <p className="text-gray-400">
            Exchange tokens at lightning speed with minimal slippage across multiple chains.
          </p>
        </div>

        <div className="cyberpunk-card cyberpunk-card-pink p-6 glow-effect glow-effect-pink">
          <div className="w-12 h-12 mb-4 rounded bg-gradient-to-br from-cyberblue to-cyberpink flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">CONCENTRATED LIQUIDITY</h3>
          <p className="text-gray-400">Provide liquidity within custom price ranges for maximum capital efficiency.</p>
        </div>

        <div className="cyberpunk-card p-6 glow-effect">
          <div className="w-12 h-12 mb-4 rounded bg-gradient-to-br from-cyberpink to-cyberblue flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 8V16M12 11V16M8 14V16M4 18H20C20.5523 18 21 17.5523 21 17V7C21 6.44772 20.5523 6 20 6H4C3.44772 6 3 6.44772 3 7V17C3 17.5523 3.44772 18 4 18Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">REAL-TIME ANALYTICS</h3>
          <p className="text-gray-400">
            Track your positions, analyze market trends, and optimize your strategy with advanced tools.
          </p>
        </div>
      </div>
    </div>
  )
}
