import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ModernHeroSection from '../components/HomePage/ModernHeroSection'
import ModernFeaturesSection from '../components/HomePage/ModernFeaturesSection'
import SupportedPlants from '../components/HomePage/SupportedPlants'
import UploadGuidelinesSection from '../components/HomePage/UploadGuidelinesSection'
import ProcessSection from '../components/HomePage/ProcessSection'
import AdvancedFeatures from '../components/HomePage/AdvancedFeatures'
import ModernStatsSection from '../components/HomePage/ModernStatsSection'
import MLTransparencySection from '../components/HomePage/MLTransparencySection'
import TestimonialsSection from '../components/HomePage/TestimonialsSection'
import FAQSection from '../components/HomePage/FAQSection'
import ModernFooter from '../components/HomePage/ModernFooter'
import ModernCTASection from '../components/HomePage/ModernCTASection'
import HowItWorksSection from '../components/HomePage/HowItWorksSection'
import { API_BASE_URL, tokenManager } from '../config/api'
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization'
import { statsService } from '../services/statsService'
import { demoService } from '../services/demoService'
import '../styles/animations.css'
import '../styles/modern.css'
import { FaCheckCircle } from 'react-icons/fa'

const HomePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const [scrollY, setScrollY] = useState(0)
  const [stats, setStats] = useState({ 
    diagnoses: 0, 
    accuracy: 0, 
    diseases: 0, 
    plants: 0 
  })
  const [targetStats, setTargetStats] = useState({ 
    diagnoses: 50000, 
    accuracy: 95.8, 
    diseases: 38, 
    plants: 14 
  })

  const { prefersReducedMotion, isLowEndDevice } = usePerformanceOptimization()

  // Optimized scroll tracking
  useEffect(() => {
    if (prefersReducedMotion || isLowEndDevice) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prefersReducedMotion, isLowEndDevice])

  // Intersection Observer for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.section
            if (id) {
              setVisibleSections(prev => new Set([...prev, id]))
              observer.unobserve(entry.target)
            }
          }
        })
      },
      { threshold: 0.15 }
    )

    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Load stats from backend
  useEffect(() => {
    const loadStats = async () => {
      const backendStats = await statsService.getPublicStats()
      setTargetStats(backendStats)
    }
    loadStats()
  }, [])

  // Animate stats when visible
  useEffect(() => {
    if (!visibleSections.has('stats')) return

    let animationFrameId
    
    const animateStats = () => {
      setStats(prev => {
        const newStats = { ...prev }
        let hasChanges = false

        Object.keys(targetStats).forEach(key => {
          if (prev[key] < targetStats[key]) {
            const increment = key === 'accuracy' ? 0.1 : key === 'diagnoses' ? 100 : 0.5
            newStats[key] = Math.min(prev[key] + increment, targetStats[key])
            hasChanges = true
          }
        })

        if (hasChanges) {
          animationFrameId = requestAnimationFrame(animateStats)
        }

        return newStats
      })
    }

    setStats({ diagnoses: 0, accuracy: 0, diseases: 0, plants: 0 })
    animationFrameId = requestAnimationFrame(animateStats)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [visibleSections, targetStats])

  // Auto-hide toast
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessToast])

  const handleTestLogin = async () => {
    setLoading(true)
    try {
      const data = await demoService.loginAsDemo()

      if (data.success) {
        tokenManager.setToken(data.token)
        localStorage.setItem('userId', data.user_id)
        localStorage.setItem('username', data.username)
        localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false')
        navigate('/demo_results')
      }
    } catch (err) {
      console.error('Demo login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToAuth = useCallback(() => {
    const authSection = document.getElementById('auth-section')
    if (authSection) {
      authSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [])

  return (
    <div className="theme-page min-h-screen bg-cover bg-center bg-fixed relative overscroll-none" style={{backgroundImage: 'var(--app-background-image)'}}>
      <div className="theme-overlay absolute inset-0"></div>

      {/* Reduced background particles - only on high-end devices */}
      {!prefersReducedMotion && !isLowEndDevice && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-400/8 rounded-full animate-float"
              style={{
                left: `${20 + i * 20}%`,
                top: `${20 + i * 15}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${25 + i * 5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-24 right-6 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 backdrop-blur-lg border border-green-400/30">
            <FaCheckCircle className="w-6 h-6 animate-pulse" />
            <div>
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-sm opacity-90">Please login with your credentials</p>
            </div>
          </div>
        </div>
      )}

      <Header />

      <ModernHeroSection 
        scrollY={scrollY}
        scrollToAuth={scrollToAuth}
        handleTestLogin={handleTestLogin}
        demoLoading={loading}
        prefersReducedMotion={prefersReducedMotion}
        onSignupSuccess={() => setShowSuccessToast(true)}
      />

      <div data-section="how-it-works">
        <HowItWorksSection />
      </div>

      <div data-section="features">
        <ModernFeaturesSection isVisible={visibleSections.has('features')} />
      </div>

      <div data-section="plants">
        <SupportedPlants isVisible={visibleSections.has('plants')} />
      </div>

      <div data-section="guidelines">
        <UploadGuidelinesSection isVisible={visibleSections.has('guidelines')} />
      </div>

      <div data-section="advanced">
        <AdvancedFeatures isVisible={visibleSections.has('advanced')} />
      </div>

      <div data-section="stats">
        <ModernStatsSection isVisible={visibleSections.has('stats')} />
      </div>

      <div data-section="ml-transparency">
        <MLTransparencySection isVisible={visibleSections.has('ml-transparency')} />
      </div>

      <div data-section="testimonials">
        <TestimonialsSection />
      </div>

      <div data-section="faq">
        <FAQSection />
      </div>

      <div data-section="cta">
        <ModernCTASection onGetStarted={scrollToAuth} />
      </div>

      <ModernFooter />
    </div>
  )
}

export default HomePage
