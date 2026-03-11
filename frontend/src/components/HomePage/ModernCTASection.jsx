import React from 'react'
import { FaArrowRight, FaStar, FaLeaf } from 'react-icons/fa'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

const CTASection = ({ onGetStarted }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 })

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div 
          ref={ref}
          className={`glass-card p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden transition-all duration-1000 ${
            isVisible 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-8">
            <FaLeaf className="w-10 h-10 text-green-400" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Protect Your Plants?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of growers, farmers, and researchers using LeafCure 
            for accurate, instant plant disease diagnosis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={onGetStarted}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
            >
              <FaStar className="w-4 h-4" />
              Start Free Diagnosis
              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105 active:scale-95">
              Try Demo First
            </button>
          </div>

          <p className="text-sm text-gray-400">
            No credit card required • Free plan available • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTASection
