import { createAPIClient, handleAPIError, validateImageFile } from '../utils/apiUtils'

export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Create API client with error handling
const apiClient = createAPIClient(API_BASE_URL)

export const tokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('email')
    localStorage.removeItem('userEmail')
  },
  getAuthHeaders: () => {
    const token = tokenManager.getToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}

// API methods with error handling
export const api = {
  predictDisease: async (imageFile) => {
    try {
      validateImageFile(imageFile)
      const formData = new FormData()
      formData.append('file', imageFile)
      return await apiClient.upload('/disease/predict', formData, {
        headers: tokenManager.getAuthHeaders()
      })
    } catch (error) {
      throw new Error(handleAPIError(error))
    }
  },
  
  login: async (credentials) => {
    try {
      return await apiClient.post('/auth/login', credentials)
    } catch (error) {
      throw new Error(handleAPIError(error))
    }
  },
  
  register: async (userData) => {
    try {
      return await apiClient.post('/auth/register', userData)
    } catch (error) {
      throw new Error(handleAPIError(error))
    }
  },
  
  getAdminStats: async () => {
    try {
      return await apiClient.get('/admin/stats', {
        headers: tokenManager.getAuthHeaders()
      })
    } catch (error) {
      throw new Error(handleAPIError(error))
    }
  },
  
  healthCheck: async () => {
    try {
      return await apiClient.get('/health')
    } catch (error) {
      return { status: 'offline', error: handleAPIError(error) }
    }
  }
}
