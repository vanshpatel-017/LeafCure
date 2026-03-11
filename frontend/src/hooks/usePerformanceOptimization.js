import { useState, useEffect, useRef } from 'react'

/**
 * Enhanced performance optimization hook with device detection and user preferences
 */
export const usePerformanceOptimization = () => {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [memoryInfo, setMemoryInfo] = useState(null)
  const [connectionInfo, setConnectionInfo] = useState(null)
  
  const checkDevicePerformance = useRef(() => {
    // Check for low-end devices
    const isLowEnd = 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (window.screen.width <= 375 && window.screen.height <= 667) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    setIsLowEndDevice(isLowEnd)
    
    // Get memory information if available
    if (navigator.deviceMemory) {
      setMemoryInfo({
        memory: navigator.deviceMemory,
        isLowMemory: navigator.deviceMemory <= 4
      })
    }
    
    // Get connection information if available
    if ('connection' in navigator) {
      const conn = navigator.connection
      setConnectionInfo({
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        isSlow: conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g'
      })
    }
  })

  useEffect(() => {
    // Check user preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    // Initial device check
    checkDevicePerformance.current()
    
    // Event listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleReducedMotion = (e) => setPrefersReducedMotion(e.matches)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    mediaQuery.addEventListener('change', handleReducedMotion)
    
    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              console.warn('Long task detected:', entry.duration, 'ms')
            }
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long task API not supported
      }
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      mediaQuery.removeEventListener('change', handleReducedMotion)
    }
  }, [])

  return {
    isLowEndDevice,
    prefersReducedMotion,
    isOnline,
    memoryInfo,
    connectionInfo,
    shouldOptimize: isLowEndDevice || prefersReducedMotion,
    isHighPerformance: !isLowEndDevice && !prefersReducedMotion
  }
}

/**
 * Hook for lazy loading with intersection observer
 */
export const useLazyLoading = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isVisible]
}

/**
 * Hook for debounced values
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for throttled functions
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now())

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay])
}

/**
 * Hook for memoized calculations with dependencies
 */
export const useMemoizedCalculation = (calculation, dependencies) => {
  return useMemo(() => {
    return calculation()
  }, dependencies)
}

/**
 * Hook for viewport tracking
 */
export const useViewportTracking = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  })

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewport
}

/**
 * Hook for image preloading
 */
export const useImagePreloader = (imageUrls) => {
  const [loadedImages, setLoadedImages] = useState(new Set())
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return

    let isMounted = true
    const totalImages = imageUrls.length
    let loadedCount = 0

    const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          if (isMounted) {
            loadedCount++
            setLoadedImages(prev => new Set([...prev, url]))
            setLoadingProgress((loadedCount / totalImages) * 100)
            resolve(url)
          }
        }
        img.onerror = reject
        img.src = url
      })
    }

    const loadAllImages = async () => {
      try {
        await Promise.all(imageUrls.map(loadImage))
      } catch (error) {
        console.warn('Some images failed to load:', error)
      }
    }

    loadAllImages()

    return () => {
      isMounted = false
    }
  }, [imageUrls])

  return { loadedImages, loadingProgress, isComplete: loadingProgress === 100 }
}

/**
 * Hook for managing focus trap
 */
export const useFocusTrap = (isActive) => {
  const containerRef = useRef()

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])

  return containerRef
}