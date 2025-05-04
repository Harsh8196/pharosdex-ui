"use client"

import type React from "react"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ToastProps {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  onClose?: () => void
}

export function Toast({ title, description, action, variant = "default", onClose }: ToastProps) {
  return (
    <div
      className={`
        glass-effect p-4 rounded-md shadow-lg border animate-in slide-in-from-right-full 
        ${variant === "destructive" ? "border-red-500 bg-red-500/10" : "border-white/10"}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {title && <div className="font-medium">{title}</div>}
          {description && <div className="text-sm text-gray-400 mt-1">{description}</div>}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export interface ToastActionProps {
  altText: string
  onClick?: () => void
  children: React.ReactNode
}

export function ToastAction({ altText, onClick, children }: ToastActionProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-white/10 hover:border-cyberblue/50 bg-black/40"
      onClick={onClick}
      aria-label={altText}
    >
      {children}
    </Button>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <div className="fixed top-0 right-0 z-50 p-4">{children}</div>
}

export function ToastViewport() {
  return <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4" />
}

export function ToastTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-medium">{children}</div>
}

export function ToastDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-gray-400 mt-1">{children}</div>
}

export function ToastClose() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-md text-gray-400 hover:text-white"
      onClick={() => {}}
    >
      <X className="h-4 w-4" />
    </Button>
  )
}
