import React, { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const AuthForm = ({ 
  isSignup, 
  formData, 
  onInputChange, 
  onSubmit, 
  onToggleMode, 
  error, 
  loading 
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isSignup) {
      if (!validateEmail(formData.email)) {
        return // Let HTML5 validation handle this
      }
      if (formData.password.length < 6) {
        return // Let form validation handle this
      }
    }
    
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSignup && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={formData.username}
            onChange={(e) => onInputChange('username', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter your username"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          {isSignup ? 'Email' : 'Email or Username'}
        </label>
        <input
          id="email"
          type={isSignup ? "email" : "text"}
          required
          value={isSignup ? formData.email : formData.login_identifier}
          onChange={(e) => onInputChange(isSignup ? 'email' : 'login_identifier', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
          placeholder={isSignup ? "Enter your email" : "Enter email or username"}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={isSignup ? 6 : undefined}
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 pr-12"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {isSignup && (
          <p className="text-xs text-gray-400 mt-1">
            Password must be at least 6 characters long
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-green-400 hover:text-green-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
        >
          {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </form>
  )
}

export default AuthForm