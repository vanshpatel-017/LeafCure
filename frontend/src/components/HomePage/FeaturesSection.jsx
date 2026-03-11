import React from 'react'
import { FaClock, FaCheckCircle, FaArrowRight, FaChartLine, FaSeedling } from 'react-icons/fa'
import { GiPlantWatering } from 'react-icons/gi'

const colorMap = {
  green: 'bg-green-600 text-green-400',
  blue: 'bg-green-600 text-green-400',
  purple: 'bg-emerald-600 text-emerald-400'
}

const FeaturesSection = ({ isVisible }) => {
  const featureCards = [
    {
      icon: <FaClock className="w-10 h-10" />,
      title: "Lightning Fast",
      description: "Get accurate disease diagnosis in under 3 seconds with our optimized AI models",
      color: "green",
      subText: "Instant Results",
      subIcon: <FaArrowRight />
    },
    {
      icon: <FaCheckCircle className="w-10 h-10" />,
      title: "95.8% Accuracy",
      description: "Dual AI models (ViT + Swin Transformer) ensure the highest diagnostic precision",
      color: "blue",
      subText: "Industry-Leading",
      subIcon: <FaChartLine />
    },
    {
      icon: <GiPlantWatering className="w-10 h-10" />,
      title: "Expert Treatment",
      description: "Comprehensive treatment plans and prevention strategies from agricultural experts",
      color: "purple",
      subText: "Actionable Plans",
      subIcon: <FaSeedling />
    }
  ]

  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            Why Choose <span className="text-green-400">LeafCure</span>?
          </h2>
          <p className={`text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            Advanced AI technology meets agricultural expertise
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {featureCards.map((feature, index) => (
            <div 
              key={index}
              className={`backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-gray-700/50 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
              style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}
            >
              <div className={`w-20 h-20 md:w-24 md:h-24 ${colorMap[feature.color]?.split(' ')[0] || 'bg-gray-600'} rounded-2xl flex items-center justify-center mb-8 transform transition-all duration-300 hover:scale-105`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                {feature.description}
              </p>
              <div className={`${colorMap[feature.color]?.split(' ')[1] || 'text-gray-400'} text-lg font-semibold flex items-center gap-3 transition-all duration-300 hover:gap-4`}>
                <span>{feature.subText}</span>
                {feature.subIcon}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
