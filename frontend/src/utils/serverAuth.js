// Server-side authentication validation
const API_BASE_URL = 'http://localhost:8000/api/v1'

class ServerAuthService {
  constructor() {
    this.lastError = ''
  }

  async fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  getLastError() {
    return this.lastError
  }

  async getSession() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        this.clearAuth()
        return { valid: false, user: null }
      }

      if (response.ok) {
        const data = await response.json()
        const user = data?.user || null
        if (user) {
          const isAdmin = Boolean(
            user?.is_admin ?? user?.isAdmin ?? ['admin', 'super_admin', 'superadmin'].includes(String(user?.role || '').toLowerCase())
          )
          localStorage.setItem('isAdmin', isAdmin.toString())
        }
        return { valid: true, user }
      }

      return { valid: false, user: null }
    } catch (error) {
      console.error('ServerAuth: Session validation failed:', error)
      this.clearAuth()
      return { valid: false, user: null }
    }
  }

  async validateSession() {
    const session = await this.getSession()
    return session.valid
  }

  async login(credentials) {
    this.lastError = ''

    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login_identifier: credentials.username,
          password: credentials.password
        })
      })

      if (response.ok) {
        const data = await response.json()
        const isAdmin = Boolean(
          data?.is_admin ?? data?.isAdmin ?? ['admin', 'super_admin', 'superadmin'].includes(String(data?.role || '').toLowerCase())
        )

        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('email', data.email || '')
        localStorage.setItem('userEmail', data.email || '')
        localStorage.setItem('isAdmin', isAdmin.toString())
        if (data.user_id) {
          localStorage.setItem('userId', data.user_id)
        }
        return true
      }

      this.lastError = 'Invalid credentials. Please try again.'
      return false
    } catch (error) {
      console.error('ServerAuth: Login failed with error:', error)
      this.lastError = error?.name === 'AbortError'
        ? 'Login request timed out. Please ensure backend is running on port 8000.'
        : 'Unable to connect to server. Please check backend status.'
      return false
    }
  }

  async logout() {
    try {
      await this.fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }

    this.clearAuth()
    window.location.href = '/'
  }

  clearAuth() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('userId')
  }

  hasLocalSession() {
    return !!localStorage.getItem('username')
  }
}

export default new ServerAuthService()
