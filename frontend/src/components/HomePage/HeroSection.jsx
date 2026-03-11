import React, { useState, useCallback } from 'react'
import { FaLeaf, FaArrowRight, FaRobot, FaEye, FaEyeSlash, FaSparkles, FaZap, FaShield } from 'react-icons/fa'
import { API_BASE_URL } from '../../config/api'
import '../../styles/modern.css'

const colorMap = {
  green: 'text-green-400 bg-green-600',
  blue: 'text-green-400 bg-green-600',
  purple: 'text-emerald-400 bg-emerald-600',
  orange: 'text-orange-400 bg-orange-600'
}

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
        localStorage.setItem('token', data.token)
        localStorage.setItem('userId', data.user_id)
        localStorage.setItem('username', data.username)
        localStorage.setItem('email', data.email || '')
        localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false')
        
        if (data.is_admin) {
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
        setError(data.message || 'Registration failed. Please try again.')
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
  const stats = [
    { value: 50000, label: 'Plants Diagnosed', color: 'green', id: 'stat-1' },
    { value: 95.8, label: 'Accuracy Rate', color: 'blue', id: 'stat-2' },
    { value: 38, label: 'Disease Types', color: 'purple', id: 'stat-3' },
    { value: 14, label: 'Plant Species', color: 'orange', id: 'stat-4' }
  ]

  return (
    <section className="relative pt-20 pb-8 px-4 sm:px-6 lg:px-8 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6"
          >
            <FaLeaf className="w-4 h-4 text-green-300 mr-2" />
            <span className="text-green-100 font-semibold text-sm md:text-base">
              AI-Powered Plant Detection
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Instant Plant Disease Diagnosis{' '}
            <span className="text-green-400 bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 bg-clip-text text-transparent">
              & Expert Care Plans
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-4">
            Upload a photo of your leaf and get a precise diagnosis and instant treatment recommendations in under 3 seconds.
          </p>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-2 mb-8 max-w-2xl mx-auto">
            <p className="text-sm md:text-base text-green-200">
              📸 Best results: Single leaf, good lighting, plain background
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={scrollToAuth}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <span>Get Started Free</span>
              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={handleTestLogin}
              disabled={demoLoading}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {demoLoading ? 'Loading Demo...' : 'Try Demo Upload →'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mt-12">
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
                <FaRobot className="w-3 h-3" />
                <span className="font-semibold text-xs">AI Analysis</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((stat, index) => (
                <div 
                  key={stat.id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-green-400/30 transition-all duration-300"
                >
                  <div className={colorMap[stat.color]?.split(' ')[0] || 'text-gray-400'}>
                    <div className="text-lg font-bold mb-1">
                      {stat.id === 'stat-2' ? `${stat.value}%` : `${stat.value.toLocaleString()}+`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Auth Card */}
          <div id="auth-section" className="relative">
            <div className="backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-700/50 min-h-[550px] flex flex-col transform transition-all duration-300 hover:shadow-2xl" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform transition-transform duration-500 hover:rotate-12">
                  <FaLeaf className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-300 text-sm md:text-base">
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded bg-transparent border-0 p-1"
                      style={{
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none'
                      }}
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
                    aria-busy={authLoading}
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
    </section>
  )
}

export default HeroSection






