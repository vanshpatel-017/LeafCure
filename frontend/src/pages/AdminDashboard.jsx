import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL, tokenManager } from '../config/api'
import serverAuth from '../utils/serverAuth'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [predictions, setPredictions] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [showHeader, setShowHeader] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedMessages, setSelectedMessages] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [replyModal, setReplyModal] = useState({ show: false, message: null })
  const [replyText, setReplyText] = useState('')
  const [notification, setNotification] = useState(null)
  const [profileModal, setProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({ username: '', email: '', currentPassword: '', newPassword: '' })
  const [systemStats, setSystemStats] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null })

  const username = localStorage.getItem('username') || 'Admin'

  useEffect(() => {
    let isMounted = true
    let handleScroll = null

    const initializeAdmin = async () => {
      const session = await serverAuth.getSession()

      if (!session.valid) {
        navigate('/', { replace: true })
        return
      }

      if (!session.user?.is_admin) {
        navigate('/dashboard', { replace: true })
        return
      }

      if (!isMounted) return

      fetchAdminData()
      checkSuperAdmin()
      fetchSystemStats()
      setProfileData({ username, email: localStorage.getItem('userEmail') || username + '@leafcure.com', currentPassword: '', newPassword: '' })

      let lastScroll = 0
      handleScroll = () => {
        const currentScrollY = window.scrollY
        if (currentScrollY > lastScroll && currentScrollY > 100) {
          setShowHeader(false)
        } else if (currentScrollY < lastScroll) {
          setShowHeader(true)
        }
        lastScroll = currentScrollY
      }
      window.addEventListener('scroll', handleScroll, { passive: true })

      setTimeout(() => {
        if (isMounted) setIsLoaded(true)
      }, 500)
    }

    initializeAdmin()

    return () => {
      isMounted = false
      if (handleScroll) {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [navigate, username])

  const checkSuperAdmin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/check-super`, {
        headers: tokenManager.getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setIsSuperAdmin(data.is_super_admin || username === 'vansh')
      } else {
        setIsSuperAdmin(username === 'vansh')
      }
    } catch (err) {
      console.error('Failed to check super admin status:', err)
      setIsSuperAdmin(username === 'vansh')
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/system-stats`, {
        headers: tokenManager.getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch system stats:', err)
    }
  }

  const fetchAdminData = async () => {
    try {
      const headers = tokenManager.getAuthHeaders()
      const [usersRes, messagesRes, predictionsRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/admin/contact-messages`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/admin/predictions`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/admin/analytics`, { headers }).catch(() => ({ ok: false }))
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(Array.isArray(usersData) ? usersData : [])
      } else {
        setUsers([])
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setMessages(Array.isArray(messagesData) ? messagesData : [])
      } else {
        setMessages([])
      }

      if (predictionsRes.ok) {
        const predictionsData = await predictionsRes.json()
        setPredictions(Array.isArray(predictionsData) ? predictionsData : [])
      } else {
        setPredictions([])
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setUsers([])
      setMessages([])
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/send-reply`, {
        method: 'POST',
        headers: { ...tokenManager.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: replyModal.message.id,
          reply_text: replyText,
          recipient_email: replyModal.message.email
        })
      })
      
      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Reply sent successfully!'
        })
        
        // Update message as replied
        setMessages(messages.map(msg => 
          msg.id === replyModal.message.id 
            ? { ...msg, replied: true, read: true }
            : msg
        ))
        
        setReplyModal({ show: false, message: null })
        setReplyText('')
      } else {
        throw new Error('Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      setNotification({
        type: 'error',
        message: 'Failed to send reply'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'PATCH',
        headers: { ...tokenManager.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        const result = await response.json()
        localStorage.setItem('username', profileData.username)
        localStorage.setItem('userEmail', profileData.email)
        
        setNotification({
          type: 'success',
          message: 'Profile updated successfully!'
        })
        
        setProfileModal(false)
        setProfileData({ ...profileData, currentPassword: '', newPassword: '' })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setNotification({
        type: 'error',
        message: 'Failed to update profile'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const deleteUser = async (userId, targetUser) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: tokenManager.getAuthHeaders()
      })
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        setNotification({
          type: 'success',
          message: 'User deleted successfully'
        })
        setDeleteModal({ show: false, user: null })
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setNotification({
        type: 'error',
        message: 'Failed to delete user'
      })
    } finally {
      setLoading(false)
    }
  }


  const markMessageRead = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages/${messageId}/read`, {
        method: 'PATCH',
        headers: tokenManager.getAuthHeaders()
      })
      if (response.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err)
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages/${messageId}`, {
        method: 'DELETE',
        headers: tokenManager.getAuthHeaders()
      })
      if (response.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const exportData = (data, filename) => {
    const csv = data.map(row => Object.values(row).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const logout = () => {
    serverAuth.logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed relative" style={{backgroundImage: 'url(/image/background.avif)'}}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <div className="text-white text-2xl font-semibold mb-2">Loading Admin Dashboard...</div>
            <div className="text-gray-400">Fetching system data</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative overscroll-none" style={{backgroundImage: 'url(/image/background.avif)'}}>
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Header */}
      <nav className={`backdrop-blur-xl border-b border-gray-700/50 fixed w-full top-0 z-30 transition-transform duration-500 ease-in-out ${showHeader ? 'translate-y-0' : '-translate-y-full'}`} style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
            <span className="text-2xl font-bold text-white">LeafCure</span>
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-300 text-sm font-semibold rounded-full">Admin</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
              </svg>
              <span>User Dashboard</span>
            </button>
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-left">
                  <p className="text-green-300 text-xs">Admin Panel</p>
                  <p className="text-green-300 font-semibold text-sm">{username}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={() => setProfileModal(true)} className="w-full px-4 py-2 text-left text-green-400 hover:bg-gray-700 rounded-lg transition flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
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

      <div className="pt-24 pb-12 px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Hero Section */}
          <div className={`text-center mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Admin 
              <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">Control Panel</span>
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
              Manage users, monitor system activity, and oversee LeafCure operations
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className={`flex flex-wrap justify-center gap-2 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '150ms'}}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: `Users (${users.length})`, icon: '👥' },
              { id: 'messages', label: `Messages (${messages.length})`, icon: '💬' },
              { id: 'predictions', label: `Predictions (${predictions.length})`, icon: '🔬' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === tab.id 
                    ? 'bg-red-500/20 border-2 border-red-400 text-red-300 shadow-lg shadow-red-500/20' 
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-105'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '300ms'}}>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-green-500/40 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 hover:scale-105" style={{backgroundColor: 'rgba(20, 34, 42, 0.8)'}}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-green-300 text-sm font-medium">Total Users</p>
                        <p className="text-3xl font-bold text-white">{systemStats?.total_users || users.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/40 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-500 hover:scale-105" style={{backgroundColor: 'rgba(42, 38, 20, 0.8)'}}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-yellow-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-yellow-300 text-sm font-medium">Messages</p>
                        <p className="text-3xl font-bold text-white">{systemStats?.total_messages || messages.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-green-500/40 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 hover:scale-105" style={{backgroundColor: 'rgba(20, 42, 20, 0.8)'}}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-green-300 text-sm font-medium">Predictions</p>
                        <p className="text-3xl font-bold text-white">{systemStats?.total_predictions || predictions.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-red-500/40 hover:border-red-400/60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-500 hover:scale-105" style={{backgroundColor: 'rgba(42, 20, 20, 0.8)'}}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-red-300 text-sm font-medium">Unread Messages</p>
                        <p className="text-3xl font-bold text-white">{systemStats?.unread_messages || messages.filter(m => !m.read).length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/40 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-105" style={{backgroundColor: 'rgba(42, 20, 42, 0.8)'}}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-500/30 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-emerald-300 text-sm font-medium">System Health</p>
                        <p className="text-2xl font-bold text-white">{systemStats?.system_health || 'Good'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      Recent Users
                    </h3>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">{user.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.username}</p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                          {user.is_admin && (
                            <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold rounded">Admin</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <span className="text-2xl mr-3">💬</span>
                      Recent Messages
                    </h3>
                    <div className="space-y-3">
                      {messages.slice(0, 5).map((message) => (
                        <div key={message.id} className={`p-3 rounded-lg border ${message.read ? 'bg-gray-800/50 border-gray-700' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-white font-medium text-sm">{message.subject}</p>
                            {!message.read && <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>}
                          </div>
                          <p className="text-gray-400 text-xs">From: {message.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="text-3xl mr-3">👥</span>
                    User Management
                  </h3>
                  <button 
                    onClick={() => exportData(users, 'users')}
                    className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-gray-300 pb-3 font-semibold">User</th>
                        <th className="text-gray-300 pb-3 font-semibold">Email</th>
                        <th className="text-gray-300 pb-3 font-semibold">Joined</th>
                        <th className="text-gray-300 pb-3 font-semibold">Predictions</th>
                        <th className="text-gray-300 pb-3 font-semibold">Status</th>
                        <th className="text-gray-300 pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                          <td className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">{user.username?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{user.username}</p>
                                {user.is_admin && (
                                  <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold rounded">Admin</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-gray-300">{user.email}</td>
                          <td className="py-4 text-gray-300">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="py-4 text-gray-300">{user.prediction_count || 0}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.suspended ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                            }`}>
                              {user.suspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setDeleteModal({ show: true, user })}
                                className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold hover:bg-red-500/30 transition"
                                disabled={user.is_admin && !isSuperAdmin}
                                title={user.is_admin && !isSuperAdmin ? 'Only super admin can delete other admins' : 'Permanently delete user'}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="text-3xl mr-3">💬</span>
                    Contact Messages
                  </h3>
                  <button 
                    onClick={() => exportData(messages, 'messages')}
                    className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg border transition-all hover:scale-[1.01] ${
                      message.read ? 'bg-gray-800/50 border-gray-700' : 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-white font-semibold">{message.subject}</h4>
                            {!message.read && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>}
                          </div>
                          <p className="text-gray-400 text-sm">From: {message.name} ({message.email})</p>
                          <p className="text-gray-500 text-xs">{new Date(message.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setReplyModal({ show: true, message })}
                            className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold hover:bg-green-500/30 transition"
                          >
                            Reply
                          </button>
                          {!message.read && (
                            <button 
                              onClick={() => markMessageRead(message.id)}
                              className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold hover:bg-green-500/30 transition"
                            >
                              Mark Read
                            </button>
                          )}
                          <button 
                            onClick={() => deleteMessage(message.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold hover:bg-red-500/30 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'predictions' && (
              <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="text-3xl mr-3">🔬</span>
                    AI Predictions
                  </h3>
                  <button 
                    onClick={() => exportData(predictions, 'predictions')}
                    className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-gray-300 pb-3 font-semibold">User</th>
                        <th className="text-gray-300 pb-3 font-semibold">Disease</th>
                        <th className="text-gray-300 pb-3 font-semibold">Confidence</th>
                        <th className="text-gray-300 pb-3 font-semibold">Model</th>
                        <th className="text-gray-300 pb-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.slice(0, 20).map((prediction) => (
                        <tr key={prediction.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                          <td className="py-4 text-white">{prediction.username}</td>
                          <td className="py-4 text-gray-300">{prediction.disease_name?.replace(/_/g, ' ')}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              prediction.confidence > 0.8 ? 'bg-green-500/20 text-green-300' :
                              prediction.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {(prediction.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 text-gray-300">{prediction.model_used}</td>
                          <td className="py-4 text-gray-300">{new Date(prediction.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">📈</span>
                    System Analytics
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">Disease Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(predictions.reduce((acc, pred) => {
                          const disease = pred.disease_name?.replace(/_/g, ' ') || 'Unknown'
                          acc[disease] = (acc[disease] || 0) + 1
                          return acc
                        }, {})).slice(0, 5).map(([disease, count]) => (
                          <div key={disease} className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">{disease}</span>
                            <span className="text-white font-semibold">{count}</span>
                          </div>
                        ))}
                        {predictions.length === 0 && (
                          <p className="text-gray-400 text-sm">No prediction data available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">Model Performance</h4>
                      <div className="space-y-2">
                        {Object.entries(predictions.reduce((acc, pred) => {
                          const model = pred.model_used || 'Unknown'
                          acc[model] = (acc[model] || 0) + 1
                          return acc
                        }, {})).map(([model, count]) => (
                          <div key={model} className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">{model}</span>
                            <span className="text-white font-semibold">{count}</span>
                          </div>
                        ))}
                        {predictions.length === 0 && (
                          <p className="text-gray-400 text-sm">No model data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">User Activity</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Total Users</span>
                          <span className="text-white font-semibold">{users.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Admin Users</span>
                          <span className="text-white font-semibold">{users.filter(u => u.is_admin).length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Active Users</span>
                          <span className="text-white font-semibold">{users.filter(u => !u.suspended).length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">Message Stats</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Total Messages</span>
                          <span className="text-white font-semibold">{messages.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Unread</span>
                          <span className="text-white font-semibold">{messages.filter(m => !m.read).length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Replied</span>
                          <span className="text-white font-semibold">{messages.filter(m => m.replied).length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">System Health</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Status</span>
                          <span className="text-green-400 font-semibold">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Uptime</span>
                          <span className="text-white font-semibold">99.9%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Performance</span>
                          <span className="text-green-400 font-semibold">Good</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Reply Modal */}
        {replyModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Reply to Message</h2>
                  <button
                    onClick={() => {
                      setReplyModal({ show: false, message: null })
                      setReplyText('')
                    }}
                    className="text-green-300 hover:text-green-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {replyModal.message && (
                  <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-white mb-2">Original Message:</h3>
                    <p className="text-sm text-gray-300 mb-1">Subject: {replyModal.message.subject}</p>
                    <p className="text-sm text-gray-300 mb-2">From: {replyModal.message.name} ({replyModal.message.email})</p>
                    <p className="text-gray-200">{replyModal.message.message}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Reply:
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-green-950/40 border border-green-700/60 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder:text-green-200/60"
                    placeholder="Type your reply here..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setReplyModal({ show: false, message: null })
                      setReplyText('')
                    }}
                    className="px-4 py-2 text-green-200 border border-green-700/60 rounded-md hover:bg-green-900/40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReply()}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg max-w-md w-full border border-green-700/60" style={{backgroundColor: 'rgba(20, 34, 22, 0.96)'}}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Delete User</h2>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-300 mb-2">
                    Are you sure you want to permanently delete user:
                  </p>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{deleteModal.user?.username?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{deleteModal.user?.username}</p>
                        <p className="text-gray-400 text-sm">{deleteModal.user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-red-400 text-sm mt-3">
                    This will permanently delete the user account and all associated data.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, user: null })}
                    className="px-4 py-2 text-green-200 border border-green-700/60 rounded-md hover:bg-green-900/40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteUser(deleteModal.user?.id, deleteModal.user)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {profileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg max-w-md w-full border border-green-700/60" style={{backgroundColor: 'rgba(20, 34, 22, 0.96)'}}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                  <button
                    onClick={() => setProfileModal(false)}
                    className="text-green-300 hover:text-green-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-1">Username</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      className="w-full px-3 py-2 bg-green-950/40 border border-green-700/60 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder:text-green-200/60"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full px-3 py-2 bg-green-950/40 border border-green-700/60 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder:text-green-200/60"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-green-950/40 border border-green-700/60 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder:text-green-200/60"
                      placeholder="Enter current password to change"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-1">New Password</label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-green-950/40 border border-green-700/60 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder:text-green-200/60"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setProfileModal(false)}
                    className="px-4 py-2 text-green-200 border border-green-700/60 rounded-md hover:bg-green-900/40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard



