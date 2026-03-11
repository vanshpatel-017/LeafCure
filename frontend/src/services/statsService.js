import { API_BASE_URL } from '../config/api'

export const statsService = {
  async getPublicStats() {
    // For now, return static values since backend endpoint doesn't exist
    // TODO: Implement GET /public/stats endpoint in backend
    return {
      diagnoses: 50000,
      accuracy: 95.8,
      diseases: 38,
      plants: 14
    }
    
    /* Future implementation when backend is ready:
    try {
      const response = await fetch(`${API_BASE_URL}/public/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          diagnoses: data.diagnoses || 50000,
          accuracy: data.accuracy || 95.8,
          diseases: data.diseases || 38,
          plants: data.plants || 14
        }
      }
    } catch (error) {
      console.warn('Failed to fetch stats from backend, using fallback values:', error)
    }
    */
  }
}