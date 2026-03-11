/**
 * Authentication Guard Utility
 * Provides comprehensive authentication protection and session management
 */

class AuthenticationGuard {
  constructor() {
    this.isAuthenticated = false
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutes
    this.lastActivity = Date.now()
    this.inactivityTimer = null
    this.init()
  }

  init() {
    // Check initial authentication state
    this.checkAuthState()
    
    // Set up activity tracking
    this.setupActivityTracking()
    
    // Set up navigation protection
    this.setupNavigationProtection()
    
    // Set up periodic auth checks
    this.setupPeriodicChecks()
  }

  checkAuthState() {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    const lastLogin = localStorage.getItem('lastLogin')
    
    if (!token || !username) {
      this.isAuthenticated = false
      return false
    }
    
    // Check if session has expired
    if (lastLogin) {
      const loginTime = parseInt(lastLogin)
      const now = Date.now()
      if (now - loginTime > this.sessionTimeout) {
        this.logout('Session expired')
        return false
      }
    }
    
    this.isAuthenticated = true
    return true
  }

  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivity = () => {
      this.lastActivity = Date.now()
      this.resetInactivityTimer()
    }
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })
    
    this.resetInactivityTimer()
  }

  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    
    this.inactivityTimer = setTimeout(() => {
      this.logout('Session expired due to inactivity')
    }, this.sessionTimeout)
  }

  setupNavigationProtection() {
    // Block all navigation to protected routes without auth
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(state, title, url) {
      if ((url && url.includes('/dashboard')) && !authGuard.checkAuthState()) {
        window.location.href = '/'
        return
      }
      return originalPushState.apply(history, arguments)
    }
    
    history.replaceState = function(state, title, url) {
      if ((url && url.includes('/dashboard')) && !authGuard.checkAuthState()) {
        window.location.href = '/'
        return
      }
      return originalReplaceState.apply(history, arguments)
    }
    
    // Block popstate navigation
    window.addEventListener('popstate', (e) => {
      if (window.location.pathname.includes('/dashboard') && !this.checkAuthState()) {
        e.preventDefault()
        window.location.href = '/'
      }
    })
    
    // Block direct URL access
    if (window.location.pathname.includes('/dashboard') && !this.checkAuthState()) {
      window.location.href = '/'
    }
  }

  setupPeriodicChecks() {
    // Check auth state every minute
    setInterval(() => {
      if (this.isAuthenticated && !this.checkAuthState()) {
        window.location.href = '/'
      }
    }, 60000)
  }

  login(credentials) {
    // Store auth data
    localStorage.setItem('token', credentials.token || 'demo-token')
    localStorage.setItem('username', credentials.username)
    localStorage.setItem('email', credentials.email || '')
    localStorage.setItem('isAdmin', credentials.isAdmin || 'false')
    localStorage.setItem('lastLogin', Date.now().toString())
    
    this.isAuthenticated = true
    this.lastActivity = Date.now()
    this.resetInactivityTimer()
    
    // Push state to prevent back navigation
    window.history.pushState(null, '', '/dashboard')
    
    return true
  }

  logout(reason = 'User logout') {
    console.log('Logout reason:', reason)
    
    this.clearAuthData()
    this.isAuthenticated = false
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    
    // Force navigation to login
    window.history.replaceState(null, '', '/')
    window.location.href = '/'
  }

  clearAuthData() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('lastLogin')
    localStorage.removeItem('userPassword')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('fullName')
  }

  requireAuth(navigate) {
    if (!this.checkAuthState()) {
      navigate('/', { replace: true })
      return false
    }
    
    // Update activity
    this.lastActivity = Date.now()
    this.resetInactivityTimer()
    
    return true
  }

  isUserAuthenticated() {
    return this.isAuthenticated && this.checkAuthState()
  }

  getAuthData() {
    if (!this.isAuthenticated) return null
    
    return {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email'),
      isAdmin: localStorage.getItem('isAdmin') === 'true'
    }
  }
}

// Create singleton instance
const authGuard = new AuthenticationGuard()

// Global route protection - check on every page load
if (typeof window !== 'undefined') {
  const checkRoute = () => {
    if (window.location.pathname.includes('/dashboard') && !authGuard.checkAuthState()) {
      window.location.href = '/'
    }
  }
  
  // Check immediately
  checkRoute()
  
  // Check on hash change
  window.addEventListener('hashchange', checkRoute)
  
  // Check on focus (when user returns to tab)
  window.addEventListener('focus', checkRoute)
}

// Export both the class and instance
export { AuthenticationGuard }
export const AuthGuard = authGuard