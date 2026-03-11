import React from 'react'
import { FaCheckCircle, FaTimesCircle, FaCamera } from 'react-icons/fa'

const UploadGuidelines = ({ isVisible }) => {
  const doItems = [
    { text: 'Single leaf, clearly visible', icon: '🍃' },
    { text: 'Plain background (white/dark)', icon: '⚪' },
    { text: 'Natural lighting or bright indoor light', icon: '☀️' },
    { text: 'Fill the frame with the leaf', icon: '🔍' }
  ]

  const avoidItems = [
    { text: 'Blurry or out-of-focus images', icon: '😵‍💫' },
    { text: 'Multiple leaves overlapping', icon: '🍂' },
    { text: 'Very dark or overexposed photos', icon: '🌑' },
    { text: 'Leaves with heavy shadows', icon: '🌚' }
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className={`backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.1s'}}>
              <FaCamera className="w-4 h-4 text-green-300 mr-2" />
              <span className="text-green-300 font-semibold text-sm">Upload Guidelines</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold text-white mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.2s'}}>
              📸 Get the <span className="text-green-400">Best Results</span>
            </h2>
            <p className={`text-lg text-gray-300 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.3s'}}>
              Follow these simple guidelines for accurate disease detection
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Do This Section */}
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.4s'}}>
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center mb-6">
                  <FaCheckCircle className="w-6 h-6 text-green-400 mr-3" />
                  <h3 className="text-2xl font-bold text-green-300">✅ Do This</h3>
                </div>
                <div className="space-y-4">
                  {doItems.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center p-4 bg-green-500/5 rounded-xl border border-green-500/20 hover:bg-green-500/10 transition-all duration-500 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{transitionDelay: isVisible ? `${0.5 + index * 0.08}s` : '0s'}}
                    >
                      <span className="text-2xl mr-4 flex-shrink-0">{item.icon}</span>
                      <p className="text-green-100 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Avoid This Section */}
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: '0.5s'}}>
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center mb-6">
                  <FaTimesCircle className="w-6 h-6 text-red-400 mr-3" />
                  <h3 className="text-2xl font-bold text-red-300">❌ Avoid This</h3>
                </div>
                <div className="space-y-4">
                  {avoidItems.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center p-4 bg-red-500/5 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-all duration-500 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{transitionDelay: isVisible ? `${0.6 + index * 0.08}s` : '0s'}}
                    >
                      <span className="text-2xl mr-4 flex-shrink-0">{item.icon}</span>
                      <p className="text-red-100 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tip */}
          <div className={`mt-8 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: '0.9s'}}>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 inline-block">
              <p className="text-amber-200 font-semibold flex items-center">
                <span className="text-xl mr-2">💡</span>
                Pro Tip: Take photos during daytime near a window for best natural lighting
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default UploadGuidelines
