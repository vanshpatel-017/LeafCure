import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import serverAuth from '../utils/serverAuth'
import { FaLeaf, FaUser, FaLock, FaSpinner } from 'react-icons/fa'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({ 
    login_identifier: '', 
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    if (serverAuth.hasLocalSession()) {
      const isAdmin = localStorage.getItem('isAdmin') === 'true'
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true })
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    setError('')

    // Enhanced validation
    const trimmedIdentifier = formData.login_identifier.trim()
    const trimmedPassword = formData.password.trim()
    
    if (!trimmedIdentifier || !trimmedPassword) {
      setError('Please enter both email/username and password')
      setLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (trimmedIdentifier.includes('@') && !emailRegex.test(trimmedIdentifier)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const loginSuccess = await serverAuth.login({
        username: trimmedIdentifier,
        password: trimmedPassword
      })
      
      if (loginSuccess) {
        const from = location.state?.from?.pathname || '/dashboard'
        const isAdmin = localStorage.getItem('isAdmin') === 'true'
        navigate(isAdmin ? '/admin' : from, { replace: true })
      } else {
        setError(serverAuth.getLastError() || 'Invalid credentials. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Unable to connect to server. Please check backend status.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field) => (e) => {
    setFormData({...formData, [field]: e.target.value})
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-green-300 hover:text-green-100 mb-4 transition-colors">
            <FaLeaf className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium"><- Back to LeafCure</span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <FaLeaf className="w-12 h-12 text-green-400 mx-auto" />
              <div className="absolute -inset-1 bg-green-500/30 rounded-full blur-xl"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-300 text-sm">Sign in to continue to your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.login_identifier}
                onChange={handleInputChange('login_identifier')}
                className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your email or username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange('password')}
                className="block w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="text-gray-400 hover:text-gray-300 text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin h-5 w-5 mr-3" />
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Demo Mode: Use any credentials to login
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Admin access: vansh@gmail.com | Regular user: any other email
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-600/50">
          <p className="text-center text-gray-400 text-sm">
            Need an account?{' '}
            <Link 
              to="/" 
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              Create account on Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

