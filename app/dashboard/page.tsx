import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import TokenTable from "@/components/token-table"
import PriceChart from "@/components/price-chart"
import TransactionHistory from "@/components/transaction-history"
import PortfolioSummary from "@/components/portfolio-summary"
import { ArrowRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-orbitron">Dashboard</h1>
            <p className="text-gray-400">Your activity and market statistics</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button asChild variant="outline" className="border-white/20 bg-black/40 hover:bg-black/60">
              <Link href="/swap">Swap</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-cyberpink to-cyberblue hover:opacity-90">
              <Link href="/liquidity">Manage Liquidity</Link>
            </Button>
          </div>
        </div>

        <PortfolioSummary />

        <Tabs defaultValue="activity" className="mb-8">
          <TabsList className="bg-black/40 border border-white/10 mb-4">
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyberpink/20 data-[state=active]:to-cyberblue/20 data-[state=active]:text-white"
            >
              Market
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-black/40 border-white/10 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-orbitron">Transaction History</CardTitle>
                    <CardDescription>Your recent transactions</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <TransactionHistory />
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-white/10 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-orbitron">ETH/USDC</CardTitle>
                    <CardDescription>Price chart</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/20 bg-black/40 hover:bg-black/60">
                    <span>View more</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <PriceChart
                    fromToken={{ symbol: "ETH", name: "Ethereum", icon: "🔷" }}
                    toToken={{ symbol: "USDC", name: "USD Coin", icon: "💵" }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market">
            <Card className="bg-black/40 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-orbitron">Top Tokens</CardTitle>
                <CardDescription>Tokens ranked by trading volume</CardDescription>
              </CardHeader>
              <CardContent>
                <TokenTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
