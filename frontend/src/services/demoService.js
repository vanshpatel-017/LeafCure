import { API_BASE_URL } from '../config/api'

export const demoService = {
  async loginAsDemo() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Demo login failed: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      throw new Error(
        error.message.includes('Failed to fetch') 
          ? 'Network error. Please check your connection.' 
          : 'Demo login unavailable. Please try regular login.'
      )
    }
  }
}