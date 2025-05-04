"use client"

import { useEffect, useRef } from "react"

interface PriceChartProps {
  fromToken: any
  toToken: any
}

export default function PriceChart({ fromToken, toToken }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Generate random price data
    const dataPoints = 48 // 24 hours with 30 min intervals
    const data: number[] = []
    let price = 2200 // Starting price for ETH/USDC

    for (let i = 0; i < dataPoints; i++) {
      // Random price movement between -2% and +2%
      const change = price * (Math.random() * 0.04 - 0.02)
      price += change
      data.push(price)
    }

    // Chart dimensions
    const chartWidth = rect.width
    const chartHeight = rect.height
    const padding = { top: 20, right: 20, bottom: 30, left: 60 }
    const availableWidth = chartWidth - padding.left - padding.right
    const availableHeight = chartHeight - padding.top - padding.bottom

    // Find min and max values for scaling
    const minValue = Math.min(...data) * 0.99
    const maxValue = Math.max(...data) * 1.01

    // Clear canvas
    ctx.clearRect(0, 0, chartWidth, chartHeight)

    // Draw grid lines
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (availableHeight - availableHeight * (i / 4))
      ctx.moveTo(padding.left, y)
      ctx.lineTo(chartWidth - padding.right, y)

      // Add price labels
      const price = minValue + (maxValue - minValue) * (i / 4)
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.font = "10px Inter, sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(price.toFixed(2), padding.left - 10, y + 4)
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 6; i++) {
      const x = padding.left + (availableWidth / 6) * i
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, chartHeight - padding.bottom)

      // Add time labels
      const hour = (24 - i * 4) % 24
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.font = "10px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(`${hour}:00`, x, chartHeight - padding.bottom + 15)
    }

    ctx.stroke()

    // Draw price line
    ctx.beginPath()
    ctx.strokeStyle = "rgba(0, 245, 255, 0.8)"
    ctx.lineWidth = 2

    // Create gradient for the area under the line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom)
    gradient.addColorStop(0, "rgba(0, 245, 255, 0.2)")
    gradient.addColorStop(1, "rgba(0, 245, 255, 0)")

    // Draw the price line
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (availableWidth / (data.length - 1)) * i
      const y = padding.top + availableHeight - ((data[i] - minValue) / (maxValue - minValue)) * availableHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    // Fill area under the line
    ctx.lineTo(padding.left + availableWidth, chartHeight - padding.bottom)
    ctx.lineTo(padding.left, chartHeight - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Add glow effect to the line
    ctx.shadowColor = "rgba(0, 245, 255, 0.5)"
    ctx.shadowBlur = 10
    ctx.strokeStyle = "rgba(0, 245, 255, 0.8)"
    ctx.lineWidth = 2

    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (availableWidth / (data.length - 1)) * i
      const y = padding.top + availableHeight - ((data[i] - minValue) / (maxValue - minValue)) * availableHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Add current price indicator
    const lastPrice = data[data.length - 1]
    const lastX = padding.left + availableWidth
    const lastY = padding.top + availableHeight - ((lastPrice - minValue) / (maxValue - minValue)) * availableHeight

    ctx.beginPath()
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FF00F5"
    ctx.fill()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.stroke()

    // Add price label
    ctx.font = "bold 12px Inter, sans-serif"
    ctx.fillStyle = "white"
    ctx.textAlign = "right"
    ctx.fillText(`${lastPrice.toFixed(2)} ${toToken.symbol}`, chartWidth - padding.right, lastY - 10)

    // Add pair label
    ctx.font = "bold 14px Inter, sans-serif"
    ctx.fillStyle = "white"
    ctx.textAlign = "left"
    ctx.fillText(`${fromToken.symbol}/${toToken.symbol}`, padding.left, padding.top - 5)

    // Add 24h change
    const startPrice = data[0]
    const priceChange = ((lastPrice - startPrice) / startPrice) * 100
    const changeColor = priceChange >= 0 ? "#00FF9D" : "#FF3864"

    ctx.font = "12px Inter, sans-serif"
    ctx.fillStyle = changeColor
    ctx.textAlign = "right"
    ctx.fillText(
      `24h: ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
      chartWidth - padding.right,
      padding.top - 5,
    )
  }, [fromToken, toToken])

  return (
    <div className="w-full h-[200px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
