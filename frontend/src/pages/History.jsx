import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenManager, API_BASE_URL } from '../config/api'
import ThemeToggle from '../components/ThemeToggle'
import useTheme from '../hooks/useTheme'

const History = () => {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const { isLight, toggleTheme } = useTheme()

  const username = localStorage.getItem('username') || 'User'

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadHistory()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      if (isOnline) {
        // Try to fetch from Firebase first
        const response = await fetch(`${API_BASE_URL}/history`, {
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken()}`
          }
        })
        
        if (response.ok) {
          const firebaseHistory = await response.json()
          setHistory(firebaseHistory)
          // Also update local storage with Firebase data
          localStorage.setItem('localHistory', JSON.stringify(firebaseHistory))
        } else {
          throw new Error('Failed to fetch from server')
        }
      } else {
        throw new Error('Offline mode')
      }
    } catch (error) {
      // Fallback to local storage
      const localHistory = JSON.parse(localStorage.getItem('localHistory') || '[]')
      setHistory(localHistory)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      localStorage.setItem('localHistory', '[]')
      setHistory([])
    }
  }

  const exportHistory = () => {
    const csvData = history.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      time: new Date(item.timestamp).toLocaleTimeString(),
      plant: item.disease_name.split('___')[0]?.replace(/_/g, ' ') || 'Unknown',
      disease: item.disease_name.split('___')[1]?.replace(/_/g, ' ') || 'Unknown',
      confidence: (item.confidence * 100).toFixed(1) + '%',
      model: item.model_used || 'AI Model'
    }))
    
    const csv = 'Date,Time,Plant,Disease,Confidence,Model\n' + 
      csvData.map(row => `${row.date},${row.time},${row.plant},${row.disease},${row.confidence},${row.model}`).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leafcure-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredHistory = history
    .filter(item => {
      if (filter === 'all') return true
      if (filter === 'healthy') return item.disease_name.toLowerCase().includes('healthy')
      if (filter === 'diseased') return !item.disease_name.toLowerCase().includes('healthy')
      return true
    })
    .filter(item => 
      item.disease_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.disease_name.split('___')[0]?.replace(/_/g, ' ') || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.timestamp) - new Date(a.timestamp)
      if (sortBy === 'confidence') return b.confidence - a.confidence
      if (sortBy === 'plant') return (a.disease_name.split('___')[0] || '').localeCompare(b.disease_name.split('___')[0] || '')
      return 0
    })

  const logout = () => {
    tokenManager.removeToken()
    navigate('/')
  }

  return (
    <div className="theme-page min-h-screen bg-cover bg-center bg-fixed relative" style={{backgroundImage: 'var(--app-background-image)'}}>
      <div className="theme-overlay absolute inset-0"></div>
      
      <nav className="theme-surface-strong backdrop-blur-xl border-b relative z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
            <span className="text-2xl font-bold text-white">LeafCure</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </button>
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-left">
                  <p className="text-gray-300 text-xs">Welcome back,</p>
                  <p className="text-green-300 font-semibold text-sm">{username}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={logout} className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-lg transition flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {!isOnline && (
        <div className="relative z-10 mx-6 mt-4">
          <div className="backdrop-blur-xl rounded-2xl p-4 border border-yellow-500/50 bg-yellow-500/20">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-300 font-semibold">Offline Mode</p>
                <p className="text-yellow-200 text-sm">Showing locally stored history. Connect to internet for full sync.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-8 pb-12 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 mb-6" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <span className="text-4xl">📊</span>
                  Prediction History
                </h1>
                <p className="text-gray-300">
                  {history.length} total scans • {isOnline ? 'Online' : 'Offline'} mode
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={exportHistory}
                  disabled={history.length === 0}
                  className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="px-4 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by plant or disease..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Filter</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                >
                  <option value="all">All Results</option>
                  <option value="healthy">Healthy Plants</option>
                  <option value="diseased">Diseased Plants</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="confidence">Confidence (Highest First)</option>
                  <option value="plant">Plant Type (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* History List */}
          {loading ? (
            <div className="backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">Loading history...</p>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 text-center" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-xl font-bold text-white mb-2">No History Found</h3>
              <p className="text-gray-400 mb-6">
                {history.length === 0 
                  ? "You haven't analyzed any plants yet. Upload your first leaf image to get started!"
                  : "No results match your current filters. Try adjusting your search criteria."
                }
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium"
              >
                Start Analyzing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item, index) => {
                const plant = item.disease_name.split('___')[0]?.replace(/_/g, ' ') || 'Unknown'
                const disease = item.disease_name.split('___')[1]?.replace(/_/g, ' ') || 'Unknown'
                const isHealthy = disease.toLowerCase().includes('healthy')
                
                return (
                  <div 
                    key={item.id || index}
                    className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
                    style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Image Preview */}
                      {item.imagePreview && (
                        <div className="flex-shrink-0">
                          <img 
                            src={item.imagePreview} 
                            alt="Plant analysis" 
                            className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl border-2 border-gray-600"
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{plant}</h3>
                            <p className={`text-lg font-semibold ${isHealthy ? 'text-green-400' : 'text-orange-400'}`}>
                              {disease}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white mb-1">
                              {(item.confidence * 100).toFixed(1)}%
                            </div>
                            <div className="text-green-400 text-sm">Confidence</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-300">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-300">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            <span className="text-gray-300">
                              {item.model_used || 'AI Model'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Confidence Bar */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                item.confidence > 0.8 ? 'bg-green-500' :
                                item.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{width: `${item.confidence * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History
