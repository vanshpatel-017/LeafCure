import React from 'react'
import { FaFlask, FaMicroscope, FaShieldAlt, FaGlobeAmericas } from 'react-icons/fa'

const colorMap = {
  cyan: 'bg-emerald-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-600',
  violet: 'bg-violet-600'
}

const AdvancedFeatures = ({ isVisible }) => {
  const professionalFeatures = [
    {
      icon: <FaFlask className="w-7 h-7" />,
      title: "Researcher Mode",
      description: "Detailed analytics and model performance data for scientific analysis",
      color: "cyan"
    },
    {
      icon: <FaMicroscope className="w-7 h-7" />,
      title: "Dual AI Models",
      description: "Compare results from both ViT and Swin Transformer for confidence",
      color: "emerald"
    },
    {
      icon: <FaShieldAlt className="w-7 h-7" />,
      title: "Disease Prevention",
      description: "Early detection and prevention strategies to protect your crops",
      color: "amber"
    },
    {
      icon: <FaGlobeAmericas className="w-7 h-7" />,
      title: "Global Database",
      description: "Access to worldwide plant disease patterns and treatments",
      color: "violet"
    }
  ]

  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 transition-all duration-1000">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700`}>
            Advanced <span className="text-emerald-400">Features</span> for Professionals
          </h2>
          <p className={`text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700`} style={{transitionDelay: '200ms'}}>
            Designed for farmers, gardeners, and agricultural researchers
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {professionalFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-700/50 transform transition-all duration-700 hover:scale-105 hover:shadow-lg ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} 
              style={{backgroundColor: 'rgba(20, 34, 22, 0.9)', transitionDelay: `${index * 150}ms`}}
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 ${colorMap[feature.color] || 'bg-gray-600'} rounded-xl flex items-center justify-center mb-6 transform transition-all duration-500 hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-base md:text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AdvancedFeatures
