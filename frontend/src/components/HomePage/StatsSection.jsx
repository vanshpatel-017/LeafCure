import React, { useState, useEffect } from 'react'

const colorMap = {
  green: 'text-green-400 bg-green-500',
  blue: 'text-green-400 bg-green-500',
  purple: 'text-emerald-400 bg-emerald-500',
  orange: 'text-orange-400 bg-orange-500'
}

const StatsSection = ({ isVisible, stats }) => {
  const statsData = [
    { value: stats.diagnoses, label: 'Plants Successfully Diagnosed', color: 'green', suffix: '+' },
    { value: stats.accuracy, label: 'Average Diagnostic Accuracy', color: 'blue', suffix: '%' },
    { value: stats.diseases, label: 'Disease Types Recognized', color: 'purple', suffix: '+' },
    { value: stats.plants, label: 'Plant Species Supported', color: 'orange', suffix: '+' }
  ]

  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 transition-all duration-1000">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl rounded-3xl md:rounded-4xl p-12 md:p-16 border border-gray-700/50 shadow-2xl" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
          <div className="text-center mb-16">
            <div className={`inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full mb-4 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              <span className="text-green-300 font-semibold text-sm">
                Powered by Vision Transformer AI • 95.8% accuracy on 87k+ images
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-bold text-white mb-6 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              Trusted by <span className="text-green-400">Agricultural Community</span> Worldwide
            </h2>
            <p className={`text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              From small gardens to large-scale farms
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
            {statsData.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center transform transition-all duration-300 hover:scale-105 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
              >
                <div className={`text-5xl md:text-6xl lg:text-7xl font-bold ${colorMap[stat.color]?.split(' ')[0] || 'text-gray-400'} mb-4 md:mb-6`}>
                  {stat.suffix === '%' ? 
                    `${stat.value.toFixed(1)}${stat.suffix}` : 
                    `${Math.floor(stat.value).toLocaleString()}${stat.suffix}`
                  }
                </div>
                <p className="text-gray-300 text-lg md:text-xl">
                  {stat.label}
                </p>
                <div className={`w-32 md:w-40 h-2 ${colorMap[stat.color]?.split(' ')[1] || 'bg-gray-500'} mx-auto mt-6 rounded-full`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default StatsSection
