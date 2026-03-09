"use client"

import { useEffect } from "react"

import { cn } from "@/lib/utils"

interface SlideOverPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: "default" | "wide" | "full"
  children: React.ReactNode
}

const widthClasses: Record<NonNullable<SlideOverPanelProps["width"]>, string> = {
  default: "max-w-md",
  wide: "max-w-2xl",
  full: "max-w-4xl",
}

const SlideOverPanel = ({
  open,
  onClose,
  title,
  subtitle,
  width = "default",
  children,
}: SlideOverPanelProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 flex w-full flex-col bg-background shadow-xl transition-transform duration-300 ease-in-out",
          widthClasses[width]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export { SlideOverPanel }
export type { SlideOverPanelProps }
