import React from 'react'
import { FaBolt, FaShieldAlt, FaGlobe, FaMicroscope, FaClock, FaMobile, FaChartBar, FaUsers } from 'react-icons/fa'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

const features = [
  {
    icon: FaBolt,
    title: 'Lightning Fast',
    description: 'Get results in under 3 seconds with our optimized AI pipeline',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: FaShieldAlt,
    title: 'Dual AI Models',
    description: 'ViT + Swin Transformer for maximum accuracy and reliability',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: FaGlobe,
    title: 'Global Database',
    description: 'Access worldwide plant disease patterns and treatments',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: FaMicroscope,
    title: 'Researcher Mode',
    description: 'Detailed analytics and model performance data for research',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: FaClock,
    title: '24/7 Available',
    description: 'Diagnose your plants anytime, anywhere in the world',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: FaMobile,
    title: 'Mobile Ready',
    description: 'Fully responsive design works on any device',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: FaChartBar,
    title: 'Track Progress',
    description: 'Monitor your plant\'s recovery with historical data',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: FaUsers,
    title: 'Expert Community',
    description: 'Connect with agricultural experts and fellow growers',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
]

const FeatureCard = ({ feature, index }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={`glass-card p-6 hover-lift group text-center transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{ transitionDelay: `${index * 75}ms` }}
    >
      <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className={`w-7 h-7 ${feature.color}`} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-gray-300">
        {feature.description}
      </p>
    </div>
  )
}

const ModernFeaturesSection = ({ isVisible }) => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-800/50 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Why Choose <span className="gradient-text">LeafCure</span>?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Advanced AI technology meets agricultural expertise
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ModernFeaturesSection
