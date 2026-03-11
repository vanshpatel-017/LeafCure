import React from 'react'
import { FaLeaf } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-gray-700/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 animate-fade-in">
            <FaLeaf className="w-8 h-8 text-green-500 animate-pulse" />
            <span className="text-2xl font-bold text-white">LeafCure</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-gray-400 text-base mb-2">
              © {new Date().getFullYear()} LeafCure. AI-powered plant disease detection platform.
              <br className="hidden md:block" />
              Helping farmers and gardeners protect their plants worldwide.
            </p>
            <p className="text-amber-300 text-sm font-medium mb-2">
              ⚠️ AI predictions are for guidance only - consult agricultural experts for serious issues
            </p>
            <p className="text-gray-400 text-sm">
              Questions? <a href="mailto:support@leafcure.com" className="text-green-400 hover:text-green-300 transition-colors">support@leafcure.com</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
