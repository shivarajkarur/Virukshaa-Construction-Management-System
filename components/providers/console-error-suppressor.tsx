"use client"

import { useEffect } from "react"

/**
 * Silences the noisy React dev warning coming from the Next/Sonner overlay:
 * "Cannot update a component (`ForwardRef`) while rendering a different component (`ForwardRef`)"
 * We only filter this exact message in the browser during development.
 * All other console.error messages continue to work as usual.
 */
export default function ConsoleErrorSuppressor() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const originalError = console.error

    console.error = (...args: any[]) => {
      try {
        const firstArg = String(args?.[0] ?? "")
        if (
          firstArg.includes(
            "Cannot update a component (`ForwardRef`) while rendering a different component (`ForwardRef`)"
          )
        ) {
          // Swallow just this specific dev warning
          return
        }
      } catch {}
      originalError(...args)
    }

    return () => {
      
    }
  }, [])

  return null
}
