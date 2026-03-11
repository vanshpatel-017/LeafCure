import React from 'react'
import { FaUpload, FaBrain, FaFileAlt, FaChartLine } from 'react-icons/fa'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

const features = [
  {
    icon: FaUpload,
    step: '01',
    title: 'Upload Photo',
    description: 'Take a clear photo of the affected plant leaf and upload it to our platform.',
    color: 'green',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
  },
  {
    icon: FaBrain,
    step: '02',
    title: 'AI Analysis',
    description: 'Our dual AI models (ViT + Swin Transformer) analyze the image instantly.',
    color: 'cyan',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  {
    icon: FaFileAlt,
    step: '03',
    title: 'Get Diagnosis',
    description: 'Receive detailed diagnosis with confidence scores and disease information.',
    color: 'purple',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  {
    icon: FaChartLine,
    step: '04',
    title: 'Treatment Plan',
    description: 'Get expert treatment recommendations and prevention strategies.',
    color: 'orange',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
  },
]

const FeatureCard = ({ feature, index }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 })

  return (
    <div
      ref={ref}
      className={`glass-card p-6 hover-lift group transition-all duration-700 border ${feature.borderColor} ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <span className={`text-6xl font-bold ${feature.textColor} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}>
        {feature.step}
      </span>
      
      <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mt-2 mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className={`w-7 h-7 ${feature.textColor}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-gray-300 leading-relaxed">
        {feature.description}
      </p>

      <div className={`h-1 w-12 ${feature.bgColor} rounded-full mt-4 group-hover:w-full transition-all duration-500`} />
    </div>
  )
}

const HowItWorksSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      
      <div className="max-w-6xl mx-auto">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Simple 4-step process to diagnose and treat your plants
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        <div className="hidden lg:block relative mt-8">
          <div className="absolute top-0 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 via-emerald-500 to-orange-500 opacity-30" />
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
