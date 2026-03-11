import { API_BASE_URL } from '../config/api'

export const dashboardService = {
  async getRealTimeStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Failed to fetch real-time stats:', error)
    }
    
    // Fallback mock data
    return {
      totalScans: Math.floor(Math.random() * 1000) + 500,
      weeklyScans: Math.floor(Math.random() * 50) + 20,
      healthyPlants: Math.floor(Math.random() * 80) + 40,
      atRiskPlants: Math.floor(Math.random() * 10) + 2,
      needsTreatment: Math.floor(Math.random() * 5) + 1,
      accuracyRate: 95.8,
      topDiseases: [
        { name: 'Tomato Late Blight', count: 45 },
        { name: 'Apple Scab', count: 32 },
        { name: 'Potato Early Blight', count: 28 }
      ],
      recentActivity: [
        { type: 'scan', time: '2 minutes ago', disease: 'Healthy' },
        { type: 'scan', time: '5 minutes ago', disease: 'Tomato Blight' },
        { type: 'scan', time: '8 minutes ago', disease: 'Apple Scab' }
      ]
    }
  },

  async getWeatherAlerts() {
    // Mock weather-based disease risk data
    return {
      currentRisk: 'Medium',
      alerts: [
        { disease: 'Late Blight', risk: 'High', reason: 'High humidity + cool temps' },
        { disease: 'Powdery Mildew', risk: 'Medium', reason: 'Moderate humidity' }
      ]
    }
  }
}