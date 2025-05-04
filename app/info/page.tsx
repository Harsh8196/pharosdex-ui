import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import TokenTable from "@/components/token-table"
import VolumeChart from "@/components/volume-chart"

export default function InfoPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Market Overview</h1>
          <p className="text-gray-400">Real-time statistics and token information</p>
        </div>
        <Button
          asChild
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Link href="/swap">Go to Swap</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Volume (24h)</CardDescription>
            <CardTitle className="text-2xl">$124,583,291</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-500 text-sm">+12.4% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-2xl">1,245,832</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-500 text-sm">+5.7% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value Locked</CardDescription>
            <CardTitle className="text-2xl">$892,451,023</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 text-sm">-2.1% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="volume" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="tokens">Top Tokens</TabsTrigger>
        </TabsList>
        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Trading Volume</CardTitle>
              <CardDescription>Last 7 days trading volume</CardDescription>
            </CardHeader>
            <CardContent>
              <VolumeChart />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Top Tokens</CardTitle>
              <CardDescription>Tokens ranked by trading volume</CardDescription>
            </CardHeader>
            <CardContent>
              <TokenTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Swaps</CardTitle>
          <CardDescription>Latest transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">ETH</div>
                  <div className="text-sm">
                    <div>0.45 ETH → 1,245 USDC</div>
                    <div className="text-gray-500 text-xs">{`0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">{`${Math.floor(Math.random() * 59) + 1}m ago`}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
