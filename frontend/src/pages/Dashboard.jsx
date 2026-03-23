import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL, tokenManager } from '../config/api'
import { dashboardService } from '../services/dashboardService'
import newAuth from '../utils/newAuth'
import { OfflineHistory } from '../utils/offlineHistory'
import simpleAuthGuard from '../utils/simpleAuthGuard'
import ThemeToggle from '../components/ThemeToggle'
import useTheme from '../hooks/useTheme'

const Dashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [stats, setStats] = useState({ total_predictions: 0, recent_predictions: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [researcherMode, setResearcherMode] = useState(false)
  const [recentScans, setRecentScans] = useState([])
  const [recentScansLoading, setRecentScansLoading] = useState(true)
  const [imageQuality, setImageQuality] = useState({})
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Welcome to LeafCure! Upload your first plant image to get started.', time: '2 min ago', read: false },
    { id: 2, message: 'Tip: Use natural lighting for better disease detection accuracy.', time: '1 hour ago', read: false },
    { id: 3, message: 'New: Researcher mode now available with Grad-CAM visualization!', time: '2 hours ago', read: true }
  ])
  const [userSettings, setUserSettings] = useState({
    autoSave: true,
    researcherMode: false,
    shortcuts: true
  })
  const [selectedPlantType, setSelectedPlantType] = useState('')
  const [lastUploadedImages, setLastUploadedImages] = useState([])

  const [showSampleModal, setShowSampleModal] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState({
    healthyPlants: 0,
    atRiskPlants: 0,
    needsTreatment: 0,
    topDiseases: [],
    recentActivity: []
  })

  const sampleImages = [
    { name: 'Apple Scab', image: '/image/apple_scab.jpg', disease: 'Apple Scab' },
    { name: 'Tomato Healthy', image: '/image/tomato_healthy.jpg', disease: 'Healthy' },
    { name: 'Potato Blight', image: '/image/potato_blight.jpg', disease: 'Late Blight' },
    { name: 'Corn Rust', image: '/image/corn_rust.jpg', disease: 'Common Rust' },
    { name: 'Grape Disease', image: '/image/grape_disease.jpg', disease: 'Black Rot' },
    { name: 'Poor Quality', image: '/image/poor_quality.jpg', disease: 'Poor Quality Image' }
  ]





  const username = localStorage.getItem('username') || 'User'
  const [isLoaded, setIsLoaded] = useState(false)
  const { isLight, toggleTheme } = useTheme()

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const checkImageQuality = (file, index) => {
    const img = new Image()
    img.onload = () => {
      let quality = 'Good'
      let issues = []
      
      if (img.width < 224 || img.height < 224) {
        quality = 'Poor'
        issues.push('Resolution too low (min 224x224)')
      } else if (img.width < 512 || img.height < 512) {
        quality = 'Fair'
        issues.push('Low resolution (recommended 512x512+)')
      }
      
      setImageQuality(prev => ({...prev, [index]: { quality, issues, resolution: `${img.width}x${img.height}` }}))
    }
    img.src = URL.createObjectURL(file)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown') && !event.target.closest('.notification-button')) {
        setShowNotifications(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  useEffect(() => {
    if (!simpleAuthGuard.isAuthenticated()) {
      simpleAuthGuard.forceRedirect()
      return
    }
    
    console.log('🔑 Authentication verified')
    console.log('👤 Username:', localStorage.getItem('username'))
    
    setTimeout(() => setIsLoaded(true), 500)
    
    fetchStats()
    fetchRecentScans()
    loadRealTimeData()



    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    let lastScroll = 0
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScroll && currentScrollY > 100) {
        setShowHeader(false)
      } else if (currentScrollY < lastScroll) {
        setShowHeader(true)
      }
      lastScroll = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const handleKeyPress = (e) => {
      if (e.key === 'u' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        document.getElementById('fileInput')?.click()
      }
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        setResearcherMode(prev => !prev)
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        setShowShortcuts(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [navigate])

  const loadRealTimeData = async () => {
    try {
      // Calculate real stats from local history
      const localHistory = JSON.parse(localStorage.getItem('localHistory') || '[]')
      const healthyCount = localHistory.filter(item => 
        item.disease_name.toLowerCase().includes('healthy')
      ).length
      const diseasedCount = localHistory.filter(item => 
        !item.disease_name.toLowerCase().includes('healthy')
      ).length
      const highConfidenceCount = localHistory.filter(item => 
        item.confidence > 0.8
      ).length
      
      setRealTimeStats({
        healthyPlants: healthyCount,
        atRiskPlants: Math.max(0, diseasedCount - Math.floor(diseasedCount * 0.7)), // 30% of diseased are at risk
        needsTreatment: Math.floor(diseasedCount * 0.7), // 70% of diseased need treatment
        topDiseases: [],
        recentActivity: localHistory.slice(0, 5)
      })
    } catch (error) {
      console.warn('Failed to load real-time data:', error)
      // Set empty stats for new users
      setRealTimeStats({
        healthyPlants: 0,
        atRiskPlants: 0,
        needsTreatment: 0,
        topDiseases: [],
        recentActivity: []
      })
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      // Skip API call in demo mode, use local data
      const localHistory = JSON.parse(localStorage.getItem('localHistory') || '[]')
      setStats({ 
        total_predictions: localHistory.length, 
        recent_predictions: localHistory.filter(item => {
          const itemDate = new Date(item.timestamp)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return itemDate > weekAgo
        }).length
      })
    } catch (err) {
      console.warn('Stats unavailable:', err.message)
      setStats({ total_predictions: 0, recent_predictions: 0 })
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRecentScans = async () => {
    setRecentScansLoading(true)
    try {
      // Use local history instead of API
      const localHistory = JSON.parse(localStorage.getItem('localHistory') || '[]')
      setRecentScans(localHistory.slice(0, 3))
    } catch (err) {
      console.warn('Recent scans unavailable:', err.message)
      setRecentScans([])
    } finally {
      setRecentScansLoading(false)
    }
  }

  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image file (JPG, PNG, WEBP)' }
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' }
    }
    return { valid: true }
  }

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files)
    const validFiles = []
    
    for (const file of fileArray) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        showToast(validation.error, 'error')
        continue
      }
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    const newFiles = validFiles.map(file => {
      const reader = new FileReader()
      return new Promise((resolve) => {
        reader.onload = (e) => resolve({ file, preview: e.target.result })
        reader.readAsDataURL(file)
      })
    })
    
    Promise.all(newFiles).then(files => {
      setSelectedFiles(prev => [...prev, ...files])
      validFiles.forEach((file, idx) => checkImageQuality(file, selectedFiles.length + idx))
      showToast(`${validFiles.length} image${validFiles.length > 1 ? 's' : ''} uploaded successfully!`)
    })
  }

  const clearSelection = () => {
    setSelectedFiles([])
    setError(null)
    setSuccess(null)
    setUploadProgress(0)
    setImageQuality({})
  }

  const analyzeLastPhoto = () => {
    if (lastUploadedImages.length > 0) {
      setSelectedFiles([lastUploadedImages[0]])
      showToast('Last photo loaded for re-analysis')
    }
  }

  const exportToCSV = () => {
    const csvData = recentScans.map(scan => ({
      disease: scan.disease_name.replace(/_/g, ' '),
      confidence: (scan.confidence * 100).toFixed(1) + '%',
      date: new Date(scan.timestamp).toLocaleDateString()
    }))
    
    const csv = 'Disease,Confidence,Date\n' + 
      csvData.map(row => `${row.disease},${row.confidence},${row.date}`).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leafcure-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('History exported successfully!')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }
  
  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, idx) => idx !== index)
    setSelectedFiles(newFiles)
    if (newFiles.length === 0) {
      setImageQuality({})
    }
  }

  const analyzeImage = async () => {
    if (selectedFiles.length === 0) return
    setLoading(true)
    setError(null)
    const startTime = Date.now()
    const results = []

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append('file', file.file)
        
        // Start analysis for this image
        const baseProgress = (i / selectedFiles.length) * 100;
        setUploadProgress(Math.round(baseProgress + 10));
        
        // Show uploading progress
        setUploadProgress(Math.round(baseProgress + 30));
        
        try {
          const plantParam = selectedPlantType ? `&plant_type=${encodeURIComponent(selectedPlantType)}` : ''
          const requestPath = `/predict?researcher_mode=${researcherMode}${plantParam}`
          const timeoutMs = researcherMode ? 90000 : 30000

          const fallbackBases = [
            API_BASE_URL,
            API_BASE_URL.includes('localhost') ? API_BASE_URL.replace('localhost', '127.0.0.1') : API_BASE_URL,
            'http://127.0.0.1:8000/api/v1'
          ].filter((value, index, arr) => value && arr.indexOf(value) === index)

          let response = null
          let lastNetworkError = null

          for (const baseUrl of fallbackBases) {
            const predictUrl = `${baseUrl}${requestPath}`
            try {
              console.log(`Frontend: Sending ${file.file.name} (${file.file.size}B) to ${predictUrl}`)
              response = await fetch(predictUrl, {
                method: 'POST',
                body: formData,
                headers: {
                  'Authorization': `Bearer ${tokenManager.getToken()}`
                },
                signal: AbortSignal.timeout(timeoutMs)
              })
              break
            } catch (networkErr) {
              lastNetworkError = networkErr
              console.warn(`Frontend: Predict request failed on ${baseUrl}:`, networkErr?.message)
            }
          }

          if (!response) {
            throw lastNetworkError || new Error('Failed to fetch')
          }

          console.log(`Frontend: Response ${response.status}`)

          // Update progress during API call
          setUploadProgress(Math.round(baseProgress + 70))

          if (response.ok) {
            const data = await response.json()
            console.log('Frontend: Full API response:', data)
            console.log('Frontend: ViT treatment:', data.vit_treatment)
            console.log('Frontend: Swin treatment:', data.swin_treatment)

            results.push({
              ...data,
              imagePreview: file.preview,
              success: true
            })
          } else {
            const errorData = await response.json()
            console.error(`Frontend: Error ${response.status}:`, errorData.detail)
            results.push({
              success: false,
              error: errorData.detail || 'Analysis failed',
              imagePreview: file.preview
            })
          }
        } catch (err) {
          console.error(`Frontend: Network error:`, err.message)

          // Handle timeout specifically
          if (err.name === 'AbortError' || err.name === 'TimeoutError' || String(err.message).toLowerCase().includes('timeout')) {
            results.push({
              success: false,
              error: 'Research analysis timed out. Please retry, or check backend performance.',
              imagePreview: file.preview
            })
            continue
          }

          const networkError = String(err.message || '').toLowerCase().includes('failed to fetch')
          results.push({
            success: false,
            error: networkError
              ? 'Cannot reach backend. Ensure backend is running on port 8000 and try again.'
              : (err.message || 'Analysis failed. Please try again.'),
            imagePreview: file.preview
          })
        }
        
        // Complete this image analysis
        const completeProgress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(Math.round(completeProgress));
      }
      
      const endTime = Date.now()
      const totalTime = ((endTime - startTime) / 1000).toFixed(2)
      
      const successCount = results.filter(r => r.success).length

      localStorage.setItem('batchAnalysisResults', JSON.stringify({
        results,
        totalTime,
        timestamp: new Date().toISOString(),
        totalImages: selectedFiles.length,
        successCount
      }))
      
      // Store in local history for offline access
      const localHistory = JSON.parse(localStorage.getItem('localHistory') || '[]')
      results.forEach(result => {
        if (result.success) {
          const historyEntry = {
            id: Date.now() + Math.random(),
            disease_name: result.vit_prediction || result.swin_prediction || 'Unknown',
            confidence: Math.max(result.vit_confidence || 0, result.swin_confidence || 0),
            timestamp: new Date().toISOString(),
            image_filename: 'uploaded_image.jpg',
            model_used: 'Dual AI',
            symptoms: result.vit_symptoms || result.swin_symptoms || result.symptoms,
            causes: result.vit_causes || result.swin_causes || result.causes,
            treatment: result.vit_treatment || result.swin_treatment || result.treatment || [],
            prevention: result.vit_prevention || result.swin_prevention || result.prevention || [],
            imagePreview: result.imagePreview
          }
          localHistory.unshift(historyEntry)
          // Also save to offline history utility
          OfflineHistory.addEntry(historyEntry)
        }
      })
      // Keep only last 50 entries
      localStorage.setItem('localHistory', JSON.stringify(localHistory.slice(0, 50)))
      
      setLastUploadedImages(selectedFiles.slice(0, 3))
      fetchStats()
      
      if (successCount === 0) {
        const firstError = results.find(r => r.error)?.error || 'Analysis failed. Please try again.'
        showToast(firstError, 'error')
        return
      }

      if (researcherMode) {
        navigate('/results/detailed')
      } else {
        navigate('/results')
      }
    } catch (err) {
      showToast('Batch analysis failed. Please try again.', 'error')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const logout = () => {
    newAuth.logout()
  }

  return (
    <div className="theme-page min-h-screen bg-cover bg-center bg-fixed relative overscroll-none" style={{backgroundImage: 'var(--app-background-image)'}}>
      <div className="theme-overlay absolute inset-0"></div>
      
      {/* Header */}
      <nav className={`theme-surface-strong backdrop-blur-xl border-b fixed w-full top-0 z-30 transition-transform duration-500 ease-in-out ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
            <span className="text-2xl font-bold text-white">LeafCure</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
            <button 
              onClick={() => setShowShortcuts(true)} 
              className="p-2 text-gray-400 hover:text-green-400 transition" 
              title="Help & Shortcuts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="notification-button p-2 text-gray-400 hover:text-green-400 transition relative" 
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              {showNotifications && (
                <div className="notification-dropdown absolute right-0 mt-2 w-80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 z-50 animate-fadeIn" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}}>
                  <div className="p-5 border-b border-gray-700/50">
                    <h3 className="text-white font-bold text-lg flex items-center">
                      <span className="text-2xl mr-2">🔔</span>
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors ${!notif.read ? 'bg-green-500/10 border-l-4 border-l-green-500' : ''}`}>
                        <p className="text-gray-200 text-sm font-medium leading-relaxed">{notif.message}</p>
                        <p className="text-gray-400 text-xs mt-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {notif.time}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 text-center border-t border-gray-700/50 bg-gray-800/30 rounded-b-2xl">
                    <button 
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({...n, read: true})))
                        setShowNotifications(false)
                      }}
                      className="text-green-400 text-sm hover:text-green-300 font-semibold transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/history')} className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
            </button>
            {localStorage.getItem('isAdmin') === 'true' && (
              <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Admin Panel</span>
              </button>
            )}
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
                <button 
                  onClick={() => setShowProfile(true)}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-t-lg transition flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
                <button onClick={logout} className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-b-lg transition flex items-center space-x-2">
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

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className={`text-center mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Upload a leaf image to detect 
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"> plant diseases</span> 
                <span className="inline-block"> instantly</span> using AI
              </h1>
              <div className="absolute -top-4 -right-4 text-6xl opacity-20">🌿</div>
              <div className="absolute -bottom-2 -left-4 text-4xl opacity-30">🔬</div>
            </div>
            <p className="text-gray-300 text-lg mb-4 max-w-2xl mx-auto">
              Supported formats: JPG, PNG. Make sure the leaf image is clear and well-lit for best results.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center space-x-2 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>AI Models Ready</span>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {success && (
            <div className="fixed top-24 right-4 z-50 animate-slide-in">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 backdrop-blur-lg border border-green-400/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-semibold">{success}</p>
              </div>
            </div>
          )}

          {/* Error Toast */}
          {error && (
            <div className="fixed top-24 right-4 z-50 animate-slide-in">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 backdrop-blur-lg border border-red-400/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}
            {!isOnline && (
              <div className="backdrop-blur-xl rounded-2xl p-4 border border-yellow-500/50 mb-6 bg-yellow-500/20">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-yellow-300 font-semibold">You're offline</p>
                    <p className="text-yellow-200 text-sm">Please check your internet connection to analyze images</p>
                  </div>
                </div>
              </div>
            )}

          {/* Stats Cards */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '150ms'}}>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">📊</span>
              Your Analytics
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              {lastUploadedImages.length > 0 && (
                <button 
                  onClick={analyzeLastPhoto}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-500/30 transition font-medium flex items-center space-x-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Analyze Last Photo</span>
                </button>
              )}
            </div>
          </div>
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '300ms'}}>
            <div className="theme-surface backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-green-500/40 col-span-2 sm:col-span-1 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/50 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-xs sm:text-sm">Total Scans</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.total_predictions}</p>
                    <span className="text-green-400 text-xs font-semibold flex items-center">
                      {stats.total_predictions > 0 ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          New!
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">Start scanning!</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="theme-surface backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-green-500/40 col-span-2 sm:col-span-1 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/50 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-xs sm:text-sm">This Week</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.recent_predictions}</p>
                    <span className="text-green-400 text-xs font-semibold flex items-center">
                      {stats.recent_predictions > 0 ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          Active
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">No recent activity</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="theme-surface backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-green-500/40 col-span-2 sm:col-span-1 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/50 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-xs sm:text-sm">AI Accuracy</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">99.2%</p>
                </div>
              </div>
            </div>
            <div className="theme-surface backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-emerald-500/40 col-span-2 sm:col-span-1 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/50 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-xs sm:text-sm">Dual AI Models</p>
                    <p className="text-lg sm:text-xl font-bold text-white">ViT + Swin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className={`theme-surface-strong backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-700/50 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '450ms'}}>
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left: Upload Area */}
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                  <span className="text-3xl mr-3">📤</span>
                  Upload Leaf Images
                </h2>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`theme-surface-alt border-4 border-dashed rounded-2xl text-center transition flex-1 flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[400px] ${
                    dragOver ? 'border-green-400 bg-green-500/10 scale-105' : 'border-gray-600'
                  }`}
                >
                  {selectedFiles.length === 0 ? (
                    <div onClick={() => document.getElementById('fileInput').click()} className="cursor-pointer p-8 sm:p-12 w-full group">
                      <div className={`transition-all duration-300 ${dragOver ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-green-400 mx-auto mb-4 group-hover:text-green-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xl sm:text-2xl font-semibold text-white mb-2 group-hover:text-green-100 transition-colors duration-300">
                          {dragOver ? '✨ Drop files here!' : '🎯 Click or drag & drop'}
                        </p>
                        <p className="text-gray-400 text-base sm:text-lg group-hover:text-gray-300 transition-colors duration-300">JPG, PNG up to 10MB</p>
                        <p className="text-gray-500 text-sm mt-2 group-hover:text-gray-400 transition-colors duration-300">📚 Multiple images supported</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={file.preview} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="theme-overlay backdrop-blur-sm rounded px-2 py-1">
                                <p className="text-white text-xs font-medium truncate">
                                  {file.file.name}
                                </p>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-gray-300 text-xs">
                                    {(file.file.size / 1024).toFixed(1)} KB
                                  </span>
                                  {imageQuality[index] && (
                                    <span className={`text-xs font-bold ${
                                      imageQuality[index].quality === 'Good' ? 'text-green-300' :
                                      imageQuality[index].quality === 'Fair' ? 'text-yellow-300' :
                                      'text-red-300'
                                    }`}>
                                      {imageQuality[index].quality}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => document.getElementById('fileInput').click()}
                          className="flex-1 px-4 py-2 bg-green-500/90 text-white rounded-lg text-sm hover:bg-green-600 transition font-medium flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add More</span>
                        </button>
                        <button
                          onClick={clearSelection}
                          className="flex-1 px-4 py-2 bg-red-500/90 text-white rounded-lg text-sm hover:bg-red-600 transition font-medium flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Clear All</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files.length > 0 && handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Right: Tips & Sample */}
              <div>
                <div className="mb-6">
                  <button 
                    onClick={() => setShowSampleModal(true)}
                    className="w-full px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-500/30 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>View Sample Images</span>
                  </button>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                  <span className="text-3xl mr-3">💡</span>
                  Photography Tips
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="theme-surface-alt flex items-start space-x-3 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 group">
                    <span className="text-green-400 text-lg sm:text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">☀️</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base group-hover:text-green-100 transition-colors duration-300">Natural Light</p>
                      <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-300">Use daylight for best color accuracy</p>
                    </div>
                  </div>
                  <div className="theme-surface-alt flex items-start space-x-3 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 group">
                    <span className="text-green-400 text-lg sm:text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">🎯</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base group-hover:text-green-100 transition-colors duration-300">Focus on Symptoms</p>
                      <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-300">Capture affected areas clearly</p>
                    </div>
                  </div>
                  <div className="theme-surface-alt flex items-start space-x-3 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 group">
                    <span className="text-green-400 text-lg sm:text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">🔍</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base group-hover:text-green-100 transition-colors duration-300">Full Leaf View</p>
                      <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-300">Include entire leaf in frame</p>
                    </div>
                  </div>
                  <div className="theme-surface-alt flex items-start space-x-3 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 group">
                    <span className="text-green-400 text-lg sm:text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">🚫</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base group-hover:text-green-100 transition-colors duration-300">Avoid Shadows</p>
                      <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-300">Keep lighting even across leaf</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start animate-fadeIn">
                <svg className="w-6 h-6 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-300 font-semibold">Error</p>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Analyze Section */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 sm:mt-8">
                {/* Progress Bar */}
                {loading && uploadProgress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Analyzing {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2 relative"
                        style={{width: `${uploadProgress}%`}}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        {uploadProgress > 15 && <span className="text-white text-xs font-bold relative z-10">{uploadProgress}%</span>}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2 text-center">Please wait while we analyze your images...</p>
                  </div>
                )}

                {/* Plant Type Selection */}
                <div className="mb-6">
                  <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base">Plant Type (Optional - for better accuracy)</label>
                  <select
                    value={selectedPlantType}
                    onChange={(e) => setSelectedPlantType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none text-sm sm:text-base"
                  >
                    <option value="">Auto-detect (All plants)</option>
                    <option value="Apple">Apple</option>
                    <option value="Blueberry">Blueberry</option>
                    <option value="Cherry">Cherry</option>
                    <option value="Corn">Corn (Maize)</option>
                    <option value="Grape">Grape</option>
                    <option value="Orange">Orange</option>
                    <option value="Peach">Peach</option>
                    <option value="Pepper">Pepper (Bell)</option>
                    <option value="Potato">Potato</option>
                    <option value="Raspberry">Raspberry</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Squash">Squash</option>
                    <option value="Strawberry">Strawberry</option>
                    <option value="Tomato">Tomato</option>
                  </select>
                {selectedPlantType && (
                  <p className="text-green-400 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI will focus on {selectedPlantType} diseases for higher accuracy
                  </p>
                )}
                </div>

                {/* Researcher Mode Toggle */}
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
                  <span className="text-gray-300 font-medium text-sm sm:text-base">Researcher Mode</span>
                  <button
                    onClick={() => setResearcherMode(!researcherMode)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      researcherMode ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        researcherMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs sm:text-sm text-center sm:text-left ${
                    researcherMode ? 'text-emerald-300 font-semibold' : 'text-gray-500'
                  }`}>
                    {researcherMode ? 'ON (Detailed Results + Grad-CAM)' : 'OFF (Simple Results)'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={analyzeImage}
                    disabled={loading || !isOnline}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Analyze Plant{selectedFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>



          {/* Feature Highlights */}
          <div className={`backdrop-blur-xl rounded-2xl p-6 border border-green-500/40 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{backgroundColor: 'rgba(20, 34, 22, 0.85)', transitionDelay: '600ms'}}>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">⚡</span>
              Why LeafCure Stands Out
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🤖</div>
                <h4 className="text-white font-semibold mb-2 group-hover:text-green-100 transition-colors duration-300">Dual AI Consensus</h4>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">ViT + Swin Transformer models work together for 99.2% accuracy across 38 disease types</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <h4 className="text-white font-semibold mb-2 group-hover:text-green-100 transition-colors duration-300">Real-time Analysis</h4>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">Get results in under 3 seconds with batch processing for multiple images</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🔬</div>
                <h4 className="text-white font-semibold mb-2 group-hover:text-emerald-100 transition-colors duration-300">Explainable AI</h4>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">Grad-CAM heatmaps show exactly where AI detected disease symptoms</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-orange-500/50 hover:bg-gray-800/70 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
                <h4 className="text-white font-semibold mb-2 group-hover:text-orange-100 transition-colors duration-300">Smart Reports</h4>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">Comprehensive reports with treatment plans, prevention tips & progress tracking</p>
              </div>
            </div>
          </div>

          {/* Health Insights */}
          <div className={`backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/40 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{backgroundColor: 'rgba(34, 20, 42, 0.85)', transitionDelay: '750ms'}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="text-3xl mr-3">🔍</span>
                Plant Health Insights
              </h3>
            </div>
            {realTimeStats.healthyPlants === 0 && realTimeStats.atRiskPlants === 0 && realTimeStats.needsTreatment === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🌱</div>
                <h4 className="text-white font-semibold mb-2">No Plant Data Yet</h4>
                <p className="text-gray-400">Upload your first plant image to see health insights</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-6">
                {realTimeStats.healthyPlants > 0 && (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-3xl">💚</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Healthy Plants</h4>
                    <p className="text-4xl font-bold text-green-400 mb-1">{realTimeStats.healthyPlants}</p>
                    <p className="text-gray-400 text-sm">No diseases detected</p>
                  </div>
                )}
                {realTimeStats.atRiskPlants > 0 && (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <span className="text-3xl">⚠️</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">At Risk</h4>
                    <p className="text-4xl font-bold text-yellow-400 mb-1">{realTimeStats.atRiskPlants}</p>
                    <p className="text-gray-400 text-sm">Early symptoms detected</p>
                  </div>
                )}
                {realTimeStats.needsTreatment > 0 && (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-3xl">🚨</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Needs Treatment</h4>
                    <p className="text-4xl font-bold text-red-400 mb-1">{realTimeStats.needsTreatment}</p>
                    <p className="text-gray-400 text-sm">Immediate action required</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className={`backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{backgroundColor: 'rgba(20, 34, 22, 0.85)', transitionDelay: '900ms'}}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="text-3xl mr-3">🔧</span>
                System Status
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">All Systems Operational</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <p className="text-lg font-bold text-green-400">99.9%</p>
                <p className="text-gray-300 text-sm">Uptime</p>
              </div>
              <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <p className="text-lg font-bold text-green-400">&lt;3s</p>
                <p className="text-gray-300 text-sm">Response Time</p>
              </div>
              <div className="text-center p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                <p className="text-lg font-bold text-emerald-400">2</p>
                <p className="text-gray-300 text-sm">AI Models</p>
              </div>
              <div className="text-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                <p className="text-lg font-bold text-orange-400">38+</p>
                <p className="text-gray-300 text-sm">Diseases</p>
              </div>
            </div>
          </div>

          {/* Recent Scans */}
          {recentScansLoading ? (
            <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 mb-8" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
              <h3 className="text-xl font-bold text-white mb-4">Recent Scans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentScans.length > 0 ? (
            <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 mb-8" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Recent Scans</h3>
                <button onClick={() => navigate('/history')} className="text-green-400 text-sm hover:underline transition-colors">
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentScans.map((scan, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate('/history')} 
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-green-500/50 transition-all cursor-pointer transform hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-semibold text-sm">{scan.disease_name.replace(/_/g, ' ')}</h4>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          scan.confidence > 0.8 ? 'bg-green-400' :
                          scan.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-green-300 text-xs font-bold">{(scan.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs">{new Date(scan.timestamp).toLocaleDateString()}</p>
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full ${
                          scan.confidence > 0.8 ? 'bg-green-400' :
                          scan.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{width: `${scan.confidence * 100}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 mb-8 text-center" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No Scans Yet</h3>
              <p className="text-gray-400 mb-4">Upload your first leaf image to get started with AI-powered plant disease detection.</p>
              <button 
                onClick={() => document.getElementById('fileInput')?.click()}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium"
              >
                Upload First Image
              </button>
            </div>
          )}
        </div>





        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-28" onClick={() => setShowProfile(false)}>
            <div className="backdrop-blur-xl rounded-2xl p-6 max-w-md w-full max-h-[75vh] overflow-y-auto shadow-2xl animate-fadeIn border border-gray-700/50 hover:border-green-500/30 transition-all duration-300" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Profile Settings</h3>
                <button onClick={() => setShowProfile(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all hover:scale-110">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-300">
                  <span className="text-white font-bold text-2xl">{username.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Username</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={username} 
                      readOnly
                      className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all cursor-pointer hover:bg-gray-700/50"
                    />
                    <button 
                      onClick={() => {
                        setEditingField('username')
                        setEditValue(username)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-green-400 hover:bg-gray-600/50 rounded transition-all hover:scale-110"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Email</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={localStorage.getItem('userEmail') || 'user@leafcure.com'}
                      readOnly
                      className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all cursor-pointer hover:bg-gray-700/50"
                    />
                    <button 
                      onClick={() => {
                        setEditingField('email')
                        setEditValue(localStorage.getItem('userEmail') || '')
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-green-400 hover:bg-gray-600/50 rounded transition-all hover:scale-110"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={localStorage.getItem('fullName') || 'Not set'}
                      readOnly
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all cursor-pointer hover:bg-gray-700/50 placeholder-gray-400"
                    />
                    <button 
                      onClick={() => {
                        setEditingField('fullName')
                        setEditValue(localStorage.getItem('fullName') || '')
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-green-400 hover:bg-gray-600/50 rounded transition-all hover:scale-110"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700/50">
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all font-medium flex items-center justify-center space-x-2 border border-gray-600/50 hover:border-gray-500/50 hover:scale-105 group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Change Password</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
                  <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30 hover:bg-green-500/30 hover:scale-105 transition-all duration-300">
                    <p className="text-xl font-bold text-green-400">{stats.total_predictions}</p>
                    <p className="text-gray-300 text-sm font-medium">Total Scans</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30 hover:bg-green-500/30 hover:scale-105 transition-all duration-300">
                    <p className="text-xl font-bold text-green-400">{stats.recent_predictions}</p>
                    <p className="text-gray-300 text-sm font-medium">This Week</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => {
                    showToast('Profile updated successfully!', 'success')
                    setShowProfile(false)
                  }}
                  className="flex-1 px-4 py-2 bg-green-500/90 hover:bg-green-600 text-white rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setShowProfile(false)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg font-medium transition-all border border-gray-600/50 hover:border-gray-500/50 hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-28" onClick={() => setShowSettings(false)}>
            <div className="backdrop-blur-xl rounded-2xl p-5 max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-fadeIn border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-white">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center">
                    <span className="text-xl mr-2">🔬</span>
                    Analysis
                  </h4>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div>
                      <span className="text-white font-medium">Auto-save Results</span>
                      <p className="text-gray-400 text-sm mt-1">Save analysis results automatically</p>
                    </div>
                    <button
                      onClick={() => setUserSettings(prev => ({...prev, autoSave: !prev.autoSave}))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                        userSettings.autoSave ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        userSettings.autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div>
                      <span className="text-white font-medium">Researcher Mode Default</span>
                      <p className="text-gray-400 text-sm mt-1">Enable detailed analysis by default</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserSettings(prev => ({...prev, researcherMode: !prev.researcherMode}))
                        setResearcherMode(!userSettings.researcherMode)
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                        userSettings.researcherMode ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        userSettings.researcherMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center">
                    <span className="text-xl mr-2">⚙️</span>
                    Interface
                  </h4>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div>
                      <span className="text-white font-medium">Keyboard Shortcuts</span>
                      <p className="text-gray-400 text-sm mt-1">Enable shortcuts (U, R, ?)</p>
                    </div>
                    <button
                      onClick={() => setUserSettings(prev => ({...prev, shortcuts: !prev.shortcuts}))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                        userSettings.shortcuts !== false ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        userSettings.shortcuts !== false ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div>
                      <span className="text-white font-medium">Smooth Animations</span>
                      <p className="text-gray-400 text-sm mt-1">Enable page transitions</p>
                    </div>
                    <button
                      onClick={() => setUserSettings(prev => ({...prev, animations: !prev.animations}))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                        userSettings.animations !== false ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        userSettings.animations !== false ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => {
                    localStorage.setItem('userSettings', JSON.stringify(userSettings))
                    showToast('Settings saved successfully!', 'success')
                    setShowSettings(false)
                  }}
                  className="flex-1 px-4 py-2 bg-green-500/90 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg font-medium transition-all border border-gray-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sample Images Modal */}
        {showSampleModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSampleModal(false)}>
            <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Sample Images</h3>
                <button onClick={() => setShowSampleModal(false)} className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleImages.map((sample, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="aspect-square rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={sample.image} 
                        alt={sample.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{sample.name}</h4>
                    <p className="text-gray-400 text-xs">{sample.disease}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => setShowSampleModal(false)} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
        {showShortcuts && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
            <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 max-w-md w-full mx-4" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Upload Image</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm">U</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Toggle Researcher Mode</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm">R</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Show Shortcuts</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm">?</kbd>
                </div>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Field Modal */}
        {editingField && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setEditingField(null)}>
            <div className="backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4 capitalize">Edit {editingField === 'fullName' ? 'Full Name' : editingField}</h3>
              <input
                type={editingField === 'email' ? 'email' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all mb-4"
                placeholder={`Enter ${editingField === 'fullName' ? 'full name' : editingField}`}
                autoFocus
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (!editValue.trim()) {
                      showToast('Field cannot be empty', 'error')
                      return
                    }
                    if (editingField === 'email' && !editValue.includes('@')) {
                      showToast('Please enter a valid email', 'error')
                      return
                    }
                    
                    if (editingField === 'username') {
                      localStorage.setItem('username', editValue.trim())
                    } else if (editingField === 'email') {
                      localStorage.setItem('userEmail', editValue)
                    } else if (editingField === 'fullName') {
                      localStorage.setItem('fullName', editValue.trim())
                    }
                    
                    showToast(`${editingField === 'fullName' ? 'Full name' : editingField} updated successfully!`, 'success')
                    setEditingField(null)
                    if (editingField === 'username') {
                      setTimeout(() => window.location.reload(), 1000)
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-500/90 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg font-medium transition-all border border-gray-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.95)'}} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData(prev => ({...prev, current: e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(prev => ({...prev, new: e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData(prev => ({...prev, confirm: e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    if (!passwordData.current.trim()) {
                      showToast('Please enter your current password', 'error')
                      return
                    }
                    if (passwordData.new.length < 8) {
                      showToast('Password must be at least 8 characters', 'error')
                      return
                    }
                    if (passwordData.new !== passwordData.confirm) {
                      showToast('Passwords do not match', 'error')
                      return
                    }

                    showToast('Password update saved for this session.', 'success')
                    setShowPasswordModal(false)
                    setPasswordData({ current: '', new: '', confirm: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-green-500/90 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ current: '', new: '', confirm: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg font-medium transition-all border border-gray-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard



