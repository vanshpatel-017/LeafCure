import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaLeaf, FaBars, FaTimes } from 'react-icons/fa'
import ThemeToggle from './ThemeToggle'
import useTheme from '../hooks/useTheme'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isLight, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <nav 
      className={`theme-surface-strong backdrop-blur-xl border-b transition-all duration-300 fixed w-full top-0 z-50 ${
        isScrolled 
          ? 'shadow-lg' 
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <FaLeaf className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
              <div className="absolute -inset-1 bg-green-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                LeafCure
              </span>
              <p className="theme-text-soft text-xs mt-1">AI Plant Disease Detection</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            <div className="flex space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/') 
                    ? 'text-green-400 border-b-2 border-green-400 pb-1' 
                    : 'theme-text-soft hover:text-green-400'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/dashboard') 
                    ? 'text-green-400 border-b-2 border-green-400 pb-1' 
                    : 'theme-text-soft hover:text-green-400'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/history" 
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/history') 
                    ? 'text-green-400 border-b-2 border-green-400 pb-1' 
                    : 'theme-text-soft hover:text-green-400'
                }`}
              >
                History
              </Link>
            </div>

            <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
            
            <Link 
              to="/" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="theme-text w-6 h-6" />
            ) : (
              <FaBars className="theme-text w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col space-y-4 pt-4">
              <Link 
                to="/" 
                className={`text-lg font-medium transition-colors duration-300 ${
                  isActive('/') 
                    ? 'text-green-400' 
                    : 'theme-text-soft hover:text-green-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                className={`text-lg font-medium transition-colors duration-300 ${
                  isActive('/dashboard') 
                    ? 'text-green-400' 
                    : 'theme-text-soft hover:text-green-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/history" 
                className={`text-lg font-medium transition-colors duration-300 ${
                  isActive('/history') 
                    ? 'text-green-400' 
                    : 'theme-text-soft hover:text-green-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </Link>

              <ThemeToggle isLight={isLight} onToggle={toggleTheme} className="w-fit" />
              
              <div className="pt-4 border-t border-white/10">
                <Link 
                  to="/" 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-center block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Header
