import React from 'react'
import { FaUpload, FaRobot, FaFileMedicalAlt } from 'react-icons/fa'
import { GiSpotedFlower } from 'react-icons/gi'

const colorMap = {
  green: 'bg-green-600 bg-green-500/20',
  blue: 'bg-green-600 bg-green-500/20',
  purple: 'bg-emerald-600 bg-emerald-500/20',
  orange: 'bg-orange-600 bg-orange-500/20'
}

const ProcessSection = ({ isVisible }) => {
  const processSteps = [
    {
      number: "1",
      icon: <FaUpload className="w-8 h-8" />,
      title: "Upload Photo",
      description: "Take a clear photo of the affected leaf and upload it to our platform",
      color: "green"
    },
    {
      number: "2",
      icon: <FaRobot className="w-8 h-8" />,
      title: "AI Analysis",
      description: "Our advanced AI models analyze the image and identify potential diseases",
      color: "blue"
    },
    {
      number: "3",
      icon: <FaFileMedicalAlt className="w-8 h-8" />,
      title: "Get Results",
      description: "Receive detailed diagnosis with treatment recommendations and prevention tips",
      color: "purple"
    },
    {
      number: "4",
      icon: <GiSpotedFlower className="w-8 h-8" />,
      title: "Track Recovery",
      description: "Monitor your plant's recovery progress with our tracking tools",
      color: "orange"
    }
  ]

  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            How It <span className="text-green-400">Works</span>
          </h2>
          <p className={`text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`} style={{animationDelay: '0.2s'}}>
            Simple 4-step process to diagnose and treat your plants
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {processSteps.map((step, index) => (
            <div 
              key={index}
              className={`text-center ${isVisible ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative mb-10">
                <div className={`w-28 h-28 md:w-32 md:h-32 ${colorMap[step.color]?.split(' ')[0] || 'bg-gray-600'} rounded-full flex items-center justify-center mx-auto shadow-2xl transform transition-all duration-700 hover:scale-110`}>
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {step.number}
                  </span>
                </div>
              </div>
              <div className={`w-16 h-16 md:w-20 md:h-20 ${colorMap[step.color]?.split(' ')[1] || 'bg-gray-500/20'} rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-all duration-500 hover:scale-110`}>
                {step.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-300 text-lg">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProcessSection
