import React, { useEffect, useState, useRef } from 'react'
import { FaLeaf, FaBullseye, FaBug, FaSeedling } from 'react-icons/fa'

const stats = [
  {
    icon: FaLeaf,
    value: 127,
    suffix: '+',
    label: 'Plants Diagnosed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: FaBullseye,
    value: 95.8,
    suffix: '%',
    label: 'Accuracy Rate',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    isDecimal: true,
  },
  {
    icon: FaBug,
    value: 38,
    suffix: '',
    label: 'Disease Types',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: FaSeedling,
    value: 14,
    suffix: '',
    label: 'Plant Species',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
]

const ModernStatsSection = ({ isVisible }) => {
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0))
  const sectionRef = useRef(null)

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setAnimatedStats(
        stats.map((stat) => {
          const value = stat.value * easeOut
          return stat.isDecimal ? parseFloat(value.toFixed(1)) : Math.floor(value)
        })
      )

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isVisible])

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="glass-card p-8 sm:p-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Growing Agricultural Community
            </h2>
            <p className="text-gray-300">
              Join farmers and gardeners using AI for plant health
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${stat.color}`} />
                </div>
                <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${stat.color} mb-2`}>
                  {stat.isDecimal 
                    ? animatedStats[index].toFixed(1) 
                    : animatedStats[index].toLocaleString()}
                  {stat.suffix}
                </div>
                <p className="text-sm sm:text-base text-gray-300">
                  {stat.label}
                </p>
                <div className={`h-1 w-12 ${stat.bgColor} rounded-full mx-auto mt-3`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ModernStatsSection
