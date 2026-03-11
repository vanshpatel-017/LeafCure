// New JWT-based authentication service (no cookies)
const API_BASE_URL = 'http://localhost:8000/api/v1'

class NewAuthService {
  constructor() {
    this.tokenKey = 'auth_token'
    this.userKey = 'user_data'
  }

  async login(credentials) {
    try {
      console.log('NewAuth: Starting login with:', credentials)
      
      const response = await fetch(`${API_BASE_URL}/auth/simple/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      })

      console.log('NewAuth: Login response status:', response.status)
      console.log('NewAuth: Login response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('NewAuth: Login successful, data:', data)
        
        // Store token and user data in localStorage
        localStorage.setItem(this.tokenKey, data.token)
        localStorage.setItem(this.userKey, JSON.stringify({
          username: data.username,
          email: data.email || `${data.username}@leafcure.com`,
          isAdmin: data.is_admin,
          userId: data.user_id
        }))
        
        console.log('NewAuth: Token stored:', data.token.substring(0, 20) + '...')
        return { success: true, user: data }
      } else {
        const errorData = await response.text()
        console.log('NewAuth: Login failed, error:', errorData)
        return { success: false, error: errorData }
      }
    } catch (error) {
      console.error('NewAuth: Login failed with error:', error)
      return { success: false, error: error.message }
    }
  }

  async validateSession() {
    try {
      const token = this.getToken()
      console.log('NewAuth: Validating session with token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN')
      
      if (!token) {
        console.log('NewAuth: No token found, session invalid')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/auth/simple/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('NewAuth: Validation response status:', response.status)
      console.log('NewAuth: Validation response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('NewAuth: Session valid, user:', data.user)
        return true
      } else {
        console.log('NewAuth: Session invalid, clearing storage')
        this.clearAuth()
        return false
      }
    } catch (error) {
      console.error('NewAuth: Session validation failed:', error)
      this.clearAuth()
      return false
    }
  }

  async logout() {
    try {
      const token = this.getToken()
      if (token) {
        await fetch(`${API_BASE_URL}/auth/simple/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('NewAuth: Logout request failed:', error)
    }
    
    this.clearAuth()
    window.location.href = '/'
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  getUserData() {
    const userData = localStorage.getItem(this.userKey)
    return userData ? JSON.parse(userData) : null
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
    console.log('NewAuth: Authentication cleared')
  }

  hasValidSession() {
    return !!this.getToken()
  }

  getUsername() {
    const userData = this.getUserData()
    return userData ? userData.username : null
  }

  isAdmin() {
    const userData = this.getUserData()
    return userData ? userData.isAdmin : false
  }

  getUserId() {
    const userData = this.getUserData()
    return userData ? userData.userId : null
  }
}

export default new NewAuthService()