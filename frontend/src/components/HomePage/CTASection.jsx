import React from 'react'
import { FaLeaf } from 'react-icons/fa'

const CTASection = ({ isVisible, scrollToAuth, handleTestLogin }) => {
  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 transition-all duration-1000">
      <div className="max-w-5xl mx-auto">
        <div className={`backdrop-blur-xl rounded-3xl md:rounded-4xl p-12 md:p-16 border border-gray-700/50 text-center shadow-2xl transform transition-all duration-300 ${isVisible ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'}`} style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
            Ready to <span className="text-green-400">Protect</span> Your Plants?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Join thousands of growers, farmers, and researchers using LeafCure for accurate, instant plant disease diagnosis.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={scrollToAuth}
              className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl text-lg"
            >
              <span>Start Free Diagnosis</span>
              <FaLeaf className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
            <button
              onClick={handleTestLogin}
              className="px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-110 active:scale-95 text-lg"
            >
              Try Demo First
            </button>
          </div>
          <p className="text-gray-400 text-base md:text-lg mt-8">
            No credit card required • Free plan available • 30-day free trial
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTASection
