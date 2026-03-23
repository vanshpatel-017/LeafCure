import { createContext, createElement, useContext, useEffect, useState } from 'react'

const THEME_KEY = 'leafcure-theme'
const ThemeContext = createContext(null)

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(THEME_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const value = {
    theme,
    isLight: theme === 'light',
    setTheme,
    toggleTheme: () => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')
  }

  return createElement(ThemeContext.Provider, { value }, children)
}

const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}

export default useTheme
