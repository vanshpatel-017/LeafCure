const isAuthenticated = () => {
  return !!(localStorage.getItem('token') && localStorage.getItem('username'))
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('email')
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('userId')
  window.location.href = '/'
}

const forceRedirect = () => {
  if (!isAuthenticated()) {
    window.location.href = '/'
  }
}

export default {
  isAuthenticated,
  login: (credentials) => {
    localStorage.setItem('token', credentials.token || 'demo-token')
    localStorage.setItem('username', credentials.username)
    localStorage.setItem('email', credentials.email || '')
    localStorage.setItem('isAdmin', credentials.isAdmin || 'false')
    return true
  },
  logout,
  forceRedirect
}
