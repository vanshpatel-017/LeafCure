import React from 'react'

const ThemeToggle = ({ isLight, onToggle, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`theme-toggle inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 ${className}`.trim()}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isLight ? '☀' : '☾'}
      </span>
      <span>{isLight ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  )
}

export default ThemeToggle
