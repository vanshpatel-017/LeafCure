import React from 'react'
import { FaFlask, FaEye, FaExclamationTriangle, FaDatabase, FaCheckCircle, FaChartBar, FaMicrochip, FaInfoCircle } from 'react-icons/fa'

const MLTransparencySection = ({ isVisible }) => {
  const metrics = [
    { label: 'Accuracy', value: 95.8, color: 'from-green-500 to-emerald-500' },
    { label: 'Macro F1', value: 94.2, color: 'from-green-500 to-emerald-500' },
    { label: 'Precision', value: 96.1, color: 'from-emerald-500 to-emerald-500' },
    { label: 'Recall', value: 94.8, color: 'from-orange-500 to-red-500' }
  ]

  const models = [
    {
      name: 'Vision Transformer',
      icon: '🔍',
      description: 'Global context analysis',
      specialization: 'Captures whole-leaf patterns and disease spread',
      parameters: '86M'
    },
    {
      name: 'Swin Transformer',
      icon: '🎯',
      description: 'Local lesion focus',
      specialization: 'Detects fine lesion details and micro-symptoms',
      parameters: '81M'
    }
  ]

  const limitations = [
    { icon: '⏱️', title: 'Early-stage symptoms', description: 'May have reduced accuracy on very early disease manifestations' },
    { icon: '🍂', title: 'Multiple diseases', description: 'Performance may vary when multiple diseases are present on single leaf' },
    { icon: '💡', title: 'Lighting conditions', description: 'Requires adequate lighting for optimal predictions' },
    { icon: '🦠', title: 'Uncommon variants', description: 'Rare disease variants may not be recognized accurately' }
  ]

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-green-950/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50 shadow-2xl overflow-hidden" style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
          
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <div className={`inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.1s'}}>
              <FaFlask className="w-4 h-4 text-green-300 mr-2" />
              <span className="text-green-300 font-semibold text-sm">Model Transparency</span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-bold text-white mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.2s'}}>
              🔬 AI Details & <span className="text-green-400">Model Performance</span>
            </h2>
            <p className={`text-xl text-gray-300 max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.3s'}}>
              Complete transparency about our machine learning models, training data, and performance metrics
            </p>
          </div>

          {/* Dataset Section */}
          <div className={`mb-12 p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl border border-green-500/30 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.4s'}}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
                <FaDatabase className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Training Dataset</h3>
                <p className="text-gray-400">PlantVillage Database</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">87K+</div>
                <div className="text-gray-300 text-sm">Training Images</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">38</div>
                <div className="text-gray-300 text-sm">Disease Classes</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">14</div>
                <div className="text-gray-300 text-sm">Plant Species</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">80-20</div>
                <div className="text-gray-300 text-sm">Train-Test Split</div>
              </div>
            </div>
          </div>

          {/* Models Section */}
          <div className={`mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.5s'}}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
                <FaMicrochip className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Ensemble Models</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {models.map((model, idx) => (
                <div key={idx} className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-4xl mb-2">{model.icon}</div>
                      <h4 className="text-xl font-bold text-white">{model.name}</h4>
                      <p className="text-gray-400 text-sm">{model.description}</p>
                    </div>
                    <div className="bg-green-500/20 rounded-lg px-3 py-1 text-sm text-green-300 font-semibold">{model.parameters}</div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{model.specialization}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className={`mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.6s'}}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-4">
                <FaChartBar className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Performance Metrics</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, idx) => (
                <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-300 font-semibold">{metric.label}</h4>
                    <div className={`text-sm font-bold bg-gradient-to-r ${metric.color} text-transparent bg-clip-text`}>
                      {metric.value}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{width: isVisible ? `${metric.value}%` : '0%'}}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Out of 100%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations Section */}
          <div className={`mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.7s'}}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mr-4">
                <FaExclamationTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Known Limitations</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {limitations.map((limit, idx) => (
                <div key={idx} className="p-5 bg-orange-500/5 rounded-xl border border-orange-500/20 hover:bg-orange-500/10 transition-all duration-300">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 flex-shrink-0">{limit.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{limit.title}</h4>
                      <p className="text-gray-400 text-sm">{limit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Grade Badge */}
          <div className={`p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-500/30 rounded-2xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.8s'}}>
            <div className="flex items-start">
              <FaCheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-2">🏆 Research Grade</h4>
                <p className="text-green-200 text-sm leading-relaxed">
                  Models trained on peer-reviewed datasets with rigorous cross-validation. Performance verified on independent test sets. 
                  All metrics follow standard machine learning evaluation protocols. Results are reproducible and scientifically sound.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className={`mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.9s'}}>
            <FaInfoCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-200 text-sm">
              <strong>Note:</strong> Model performance varies based on image quality, lighting, and disease stage. For best results, follow our upload guidelines. Always consult with agricultural experts for critical decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MLTransparencySection
