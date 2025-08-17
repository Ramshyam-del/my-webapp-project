"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { safeLocalStorage, safeMatchMedia, getSafeDocument } from "../utils/safeStorage"

const ThemeContext = createContext({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "vite-ui-theme", ...props }) {
  const [theme, setTheme] = useState(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Hydrate theme from localStorage on client
  useEffect(() => {
    const savedTheme = safeLocalStorage.getItem(storageKey)
    if (savedTheme) {
      setTheme(savedTheme)
    }
    setMounted(true)
  }, [storageKey])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const document = getSafeDocument()
    if (!document) return

    const root = document.documentElement
    if (!root) return

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const mediaQuery = safeMatchMedia("(prefers-color-scheme: dark)")
      if (mediaQuery) {
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        root.classList.add(systemTheme)
        
        // Listen for system theme changes
        const handleChange = (e) => {
          const newSystemTheme = e.matches ? "dark" : "light"
          root.classList.remove("light", "dark")
          root.classList.add(newSystemTheme)
        }
        
        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
      }
      return
    }

    root.classList.add(theme)
  }, [theme, mounted])

  const value = {
    theme,
    setTheme: (newTheme) => {
      safeLocalStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
