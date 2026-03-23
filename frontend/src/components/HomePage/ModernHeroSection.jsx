import React, { useState, useCallback } from 'react'
import { FaLeaf, FaArrowRight, FaEye, FaEyeSlash, FaStar, FaBolt, FaShieldAlt } from 'react-icons/fa'
import { API_BASE_URL } from '../../config/api'
import '../../styles/modern.css'

const HeroSection = ({ scrollY, scrollToAuth, handleTestLogin, demoLoading, prefersReducedMotion, onSignupSuccess }) => {
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({ 
    login_identifier: '', 
    password: '', 
    username: '', 
    email: '' 
  })
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDemoVideo, setShowDemoVideo] = useState(false)

  const validateSignupEmail = (email) => {
    const trimmed = email.trim()
    if (!trimmed.includes('@')) return 'Email must contain @ symbol'
    if (!trimmed.includes('.')) return 'Email must contain a domain like .com'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address'
    return ''
  }
  
  const validateSignupPassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long'
    if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must include at least one number'
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return 'Password must include at least one special character'
    return ''
  }

  
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setAuthLoading(true)

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        const isAdmin = Boolean(
          data?.is_admin ?? data?.isAdmin ?? ['admin', 'super_admin', 'superadmin'].includes(String(data?.role || '').toLowerCase())
        )

        // Store token and user data
        localStorage.setItem('token', data.token)
        localStorage.setItem('userId', data.user_id)
        localStorage.setItem('username', data.username)
        localStorage.setItem('email', data.email || '')
        localStorage.setItem('userEmail', data.email || '')
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false')
        
        if (isAdmin) {
          window.location.href = '/admin'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Login request timed out. Please ensure backend is running on port 8000.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setAuthLoading(false)
    }
  }


  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setAuthLoading(true)

    const emailError = validateSignupEmail(formData.email)
    if (emailError) {
      setError(emailError)
      setAuthLoading(false)
      return
    }

    const passwordError = validateSignupPassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      setAuthLoading(false)
      return
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsSignup(false)
        setFormData({
          login_identifier: formData.email,
          password: '',
          username: '',
          email: ''
        })
        setError('')
        onSignupSuccess?.()
      } else {
        setError(data.detail || data.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Registration request timed out. Please ensure backend is running on port 8000.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const toggleAuthMode = useCallback(() => {
    setIsSignup(!isSignup)
    setError('')
    setFormData({ login_identifier: '', password: '', username: '', email: '' })
  }, [isSignup])

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8 animate-fade-up">
            <FaStar className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">AI-Powered Plant Detection</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-up-delay-1">
            Instant Plant Disease
            <br />
            <span className="gradient-text">Diagnosis & Care Plans</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 animate-fade-up-delay-2">
            Upload a photo of your plant and get a precise diagnosis with instant 
            treatment recommendations in under 3 seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-up-delay-3">
            <button
              onClick={scrollToAuth}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
            >
              Get Started Free
              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => setShowDemoVideo(true)}
              disabled={demoLoading}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {demoLoading ? 'Loading Demo...' : 'Watch Demo'}
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-up-delay-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <FaBolt className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <FaShieldAlt className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white">95.8% Accuracy</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <FaLeaf className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white">38+ Diseases</span>
            </div>
          </div>
        </div>

        {/* Hero Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mt-16">
          {/* Left Column - Hero Image */}
          <div className="space-y-6">
            <div className="relative">
              <div 
                className="rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-[1.01]"
                style={{ height: '360px' }}
              >
                <img 
                  src="/image/logo_image.jpeg" 
                  alt="LeafCure AI Analysis showing plant disease detection"
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%232d4633'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%2388c999' text-anchor='middle'%3ELeafCure AI Analysis%3C/text%3E%3C/svg%3E"
                  }}
                />
              </div>
              
              <div className="absolute -top-3 -right-3 bg-green-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <span className="font-semibold text-xs">AI Analysis</span>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Card */}
          <div id="auth-section" className="relative">
            <div className="glass-card p-6 md:p-8 min-h-[550px] flex flex-col transform transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 glow-effect">
              <FaLeaf className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-300">
              {isSignup ? 'Join thousands of growers worldwide' : 'Login to continue your plant care journey'}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl animate-fade-in">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-6">
            {isSignup && (
              <div className="animate-fade-in-up">
                <label htmlFor="signup-username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-400/50"
                  placeholder="Choose a username"
                  required
                />
              </div>
            )}

            {isSignup && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-400/50"
                  placeholder="Enter your email"
                  required
                />
              </div>
            )}


            {!isSignup && (
              <div className="animate-fade-in-up">
                <label htmlFor="login-identifier" className="block text-sm font-medium text-gray-300 mb-2">
                  Email or Username
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  value={formData.login_identifier}
                  onChange={(e) => handleInputChange('login_identifier', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-400/50"
                  placeholder="Enter your email or username"
                  required
                />
              </div>
            )}

            <div className="animate-fade-in-up" style={{ animationDelay: isSignup ? '0.2s' : '0.1s' }}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-400/50 pr-10"
                  placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                  required
                  minLength={isSignup ? 6 : undefined}
                  autoComplete="off"
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
              {isSignup && (
                <p className="text-xs text-gray-400 mt-2">
                  Password must be 8+ chars with upper, lower, number, and symbol
                </p>
              )}
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: isSignup ? '0.3s' : '0.2s' }}>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-h-[50px]"
              >
                {authLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                      <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    <span>{isSignup ? 'Creating Account...' : 'Signing In...'}</span>
                  </div>
                ) : (isSignup ? 'Create Free Account' : 'Sign In')}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/10 animate-fade-in">
            <p className="text-gray-400 text-sm md:text-base">
              {isSignup ? 'Already have an account?' : 'New to LeafCure?'}{' '}
              <button
                onClick={toggleAuthMode}
                className="text-green-400 font-semibold hover:text-green-300 transition-colors focus:outline-none focus:underline hover:underline"
              >
                {isSignup ? 'Login here' : 'Create an account'}
              </button>
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video Modal */}
      {showDemoVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDemoVideo(false)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">LeafCure Demo</h3>
              <button 
                onClick={() => setShowDemoVideo(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="aspect-video bg-gray-800 rounded-xl mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Demo Video Coming Soon</h4>
                <p className="text-gray-400 mb-4">Watch how LeafCure detects plant diseases in seconds</p>
                <button 
                  onClick={handleTestLogin}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Try Live Demo Instead
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">📸</div>
                <h5 className="text-white font-semibold mb-1">Upload Image</h5>
                <p className="text-gray-400 text-sm">Take or upload a photo of your plant leaf</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">🤖</div>
                <h5 className="text-white font-semibold mb-1">AI Analysis</h5>
                <p className="text-gray-400 text-sm">Our AI models analyze the image in seconds</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">💊</div>
                <h5 className="text-white font-semibold mb-1">Get Treatment</h5>
                <p className="text-gray-400 text-sm">Receive detailed treatment recommendations</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default HeroSection








