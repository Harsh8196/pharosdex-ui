"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Toast, type ToastProps } from "@/components/ui/toast"

type ToastOptions = {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let toastId = 0

export function toast(options: ToastOptions) {
  const event = new CustomEvent("toast", {
    detail: {
      ...options,
      id: ++toastId,
    },
  })
  document.dispatchEvent(event)
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const { detail } = event as CustomEvent<ToastProps & { id: number }>
      setToasts((prev) => [...prev, detail])

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== detail.id))
      }, 5000)
    }

    document.addEventListener("toast", handleToast)
    return () => document.removeEventListener("toast", handleToast)
  }, [])

  return {
    toasts,
    dismiss: (id: number) => setToasts((prev) => prev.filter((toast) => toast.id !== id)),
  }
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 right-0 p-4 w-full md:max-w-md z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          action={toast.action}
          variant={toast.variant}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </div>
  )
}
