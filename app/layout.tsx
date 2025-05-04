import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/providers/wallet-provider"
import "./globals.css"
import Header from "@/components/header"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "PharosSwap - veDEX",
  description: "Native veDEX on Pharos",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${inter.variable} font-sans bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <WalletProvider>
          <div className="min-h-screen bg-[#0A0A0F] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2A0A4A]/30 via-[#0A0A0F] to-[#0A0A0F] text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF00F5] via-[#00F5FF] to-[#FF00F5] z-50"></div>
            <div className="grid-background absolute inset-0 opacity-20"></div>
            <Header />
            <main className="relative z-10">{children}</main>
          </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
