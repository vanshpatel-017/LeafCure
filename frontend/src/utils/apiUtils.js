/**
 * Enhanced API utilities with improved error handling and performance optimizations
 */

export class APIError extends Error {
  constructor(message, status = 500, code = 'UNKNOWN_ERROR', details = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Enhanced error handling with user-friendly messages
export const handleAPIError = (error) => {
  console.error('API Error:', error)
  
  if (error.name === 'APIError') {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details
    }
  }
  
  // Network-related errors
  if (error.code === 'NETWORK_ERROR') {
    return {
      message: 'Unable to connect to server. Please check your internet connection.',
      status: 0,
      code: 'NETWORK_ERROR'
    }
  }
  
  if (error.name === 'AbortError') {
    return {
      message: 'Request timeout. Please try again.',
      status: 408,
      code: 'TIMEOUT'
    }
  }
  
  // HTTP status-based errors
  if (error.status === 429) {
    return {
      message: 'Too many requests. Please wait a moment before trying again.',
      status: 429,
      code: 'RATE_LIMIT'
    }
  }
  
  if (error.status === 413) {
    return {
      message: 'File too large. Please upload an image smaller than 10MB.',
      status: 413,
      code: 'FILE_TOO_LARGE'
    }
  }
  
  if (error.status === 401) {
    return {
      message: 'Your session has expired. Please log in again.',
      status: 401,
      code: 'UNAUTHORIZED'
    }
  }
  
  if (error.status === 403) {
    return {
      message: 'You do not have permission to access this resource.',
      status: 403,
      code: 'FORBIDDEN'
    }
  }
  
  if (error.status >= 500) {
    return {
      message: 'Server error. Our team has been notified. Please try again later.',
      status: error.status,
      code: 'SERVER_ERROR'
    }
  }
  
  if (error.status === 404) {
    return {
      message: 'The requested resource was not found.',
      status: 404,
      code: 'NOT_FOUND'
    }
  }
  
  return {
    message: error.message || 'Something went wrong. Please try again.',
    status: error.status || 0,
    code: error.code || 'UNKNOWN_ERROR'
  }
}

// Enhanced image validation with better error messages
export const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  
  if (!file) {
    throw new APIError('Please select an image file', 400, 'NO_FILE')
  }
  
  // Check file size
  if (file.size > maxSize) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
    throw new APIError(`Image is too large (${sizeInMB}MB). Please upload an image smaller than 10MB.`, 413, 'FILE_TOO_LARGE')
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const fileExtension = file.name ? file.name.split('.').pop().toLowerCase() : ''
    if (!allowedExtensions.includes(`.${fileExtension}`)) {
      throw new APIError('Please upload a JPEG, PNG, GIF, or WebP image', 400, 'INVALID_TYPE')
    }
  }
  
  // Check minimum size (avoid empty files)
  if (file.size < 100) {
    throw new APIError('Image file appears to be corrupted or too small.', 400, 'INVALID_FILE')
  }
  
  return true
}

// Enhanced confidence validation with better formatting
export const validateConfidence = (confidence) => {
  if (confidence === null || confidence === undefined) {
    return 0
  }
  
  const num = parseFloat(confidence)
  if (isNaN(num)) {
    return 0
  }
  
  // Clamp between 0 and 100 and format to 2 decimal places
  const clamped = Math.max(0, Math.min(100, num))
  return Math.round(clamped * 100) / 100
}

// Format confidence for display
export const formatConfidence = (confidence) => {
  const validated = validateConfidence(confidence)
  return `${validated.toFixed(1)}%`
}

// Enhanced API client with caching and retry logic
export const createAPIClient = (baseURL, options = {}) => {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    enableCache = true,
    cacheTTL = 5 * 60 * 1000 // 5 minutes
  } = options
  
  // Simple in-memory cache
  const cache = new Map()
  
  const makeRequest = async (url, requestOptions = {}) => {
    const cacheKey = `${requestOptions.method || 'GET'}:${url}:${JSON.stringify(requestOptions.body || {})}`.toLowerCase()
    
    // Check cache for GET requests
    if (enableCache && requestOptions.method === 'GET' && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < cacheTTL) {
        return cached.data
      }
      cache.delete(cacheKey)
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    let lastError
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${baseURL}${url}`, {
          ...requestOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions.headers
          }
        })
        
        clearTimeout(timeoutId)
        
        // Handle different response types
        let data
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }
        
        if (!response.ok) {
          throw new APIError(
            data.detail || data.message || `HTTP ${response.status}`,
            response.status,
            data.code || 'HTTP_ERROR',
            data
          )
        }
        
        // Cache successful GET requests
        if (enableCache && requestOptions.method === 'GET') {
          cache.set(cacheKey, {
            data,
            timestamp: Date.now()
          })
        }
        
        return data
      } catch (error) {
        lastError = error
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || 
            error.status === 400 || 
            error.status === 401 || 
            error.status === 403 || 
            error.status === 413) {
          break
        }
        
        // Retry logic
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }
    
    // If we get here, all retries failed
    if (lastError.name === 'AbortError') {
      throw new APIError('Request timeout. Please try again.', 408, 'TIMEOUT')
    }
    
    if (!navigator.onLine) {
      throw new APIError('No internet connection. Please check your network.', 0, 'NETWORK_ERROR')
    }
    
    throw lastError
  }
  
  return {
    get: (url, options = {}) => makeRequest(url, { ...options, method: 'GET' }),
    post: (url, data, options = {}) => makeRequest(url, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    put: (url, data, options = {}) => makeRequest(url, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    delete: (url, options = {}) => makeRequest(url, { ...options, method: 'DELETE' }),
    patch: (url, data, options = {}) => makeRequest(url, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
    upload: async (url, formData, options = {}) => {
      const controller = new AbortController()
      const uploadTimeout = timeout * 3 // Triple timeout for uploads
      const timeoutId = setTimeout(() => controller.abort(), uploadTimeout)
      
      try {
        const response = await fetch(`${baseURL}${url}`, {
          ...options,
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            ...options.headers
            // Don't set Content-Type for FormData - let browser set it with boundary
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new APIError(
            errorData.detail || errorData.message || `HTTP ${response.status}`,
            response.status,
            errorData.code || 'HTTP_ERROR',
            errorData
          )
        }
        
        return await response.json()
      } catch (error) {
        clearTimeout(timeoutId)
        
        if (error.name === 'AbortError') {
          throw new APIError('Upload timeout. Please try again with a smaller image.', 408, 'TIMEOUT')
        }
        
        throw error
      }
    },
    
    // Cache management methods
    clearCache: () => cache.clear(),
    getCacheSize: () => cache.size,
    invalidateCache: (pattern) => {
      if (pattern) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key)
          }
        }
      } else {
        cache.clear()
      }
    }
  }
}

// Utility functions for common operations
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isOnline = () => {
  return navigator.onLine
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
