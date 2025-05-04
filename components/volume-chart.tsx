"use client"

import { useEffect, useRef } from "react"

export default function VolumeChart() {
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

    // Mock data for the chart
    const data = [120, 150, 180, 220, 190, 250, 280]
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    // Chart dimensions
    const chartWidth = rect.width
    const chartHeight = rect.height
    const padding = 40
    const availableWidth = chartWidth - padding * 2
    const availableHeight = chartHeight - padding * 2

    // Find max value for scaling
    const maxValue = Math.max(...data)

    // Clear canvas
    ctx.clearRect(0, 0, chartWidth, chartHeight)

    // Draw grid lines
    ctx.beginPath()
    ctx.strokeStyle = "#2d3748"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (availableHeight - availableHeight * (i / 4))
      ctx.moveTo(padding, y)
      ctx.lineTo(chartWidth - padding, y)
    }

    // Vertical grid lines
    for (let i = 0; i < data.length; i++) {
      const x = padding + (availableWidth / (data.length - 1)) * i
      ctx.moveTo(x, padding)
      ctx.lineTo(x, chartHeight - padding)
    }

    ctx.stroke()

    // Draw bars
    const barWidth = (availableWidth / data.length) * 0.6
    const barSpacing = (availableWidth / data.length) * 0.4

    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / maxValue) * availableHeight
      const x = padding + i * (barWidth + barSpacing)
      const y = chartHeight - padding - barHeight

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, y, 0, chartHeight - padding)
      gradient.addColorStop(0, "#3b82f6")
      gradient.addColorStop(1, "#8b5cf6")

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw labels
      ctx.fillStyle = "#9ca3af"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(labels[i], x + barWidth / 2, chartHeight - padding / 2)

      // Draw values
      ctx.fillStyle = "#e5e7eb"
      ctx.fillText(`${data[i]}M`, x + barWidth / 2, y - 10)
    }

    // Draw y-axis labels
    ctx.fillStyle = "#9ca3af"
    ctx.textAlign = "right"
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue * (i / 4)).toFixed(0)
      const y = chartHeight - padding - availableHeight * (i / 4)
      ctx.fillText(`${value}M`, padding - 10, y + 4)
    }
  }, [])

  return (
    <div className="w-full h-[300px]">
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
