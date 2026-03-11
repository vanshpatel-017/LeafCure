import React from 'react'

const SupportedPlants = ({ isVisible }) => {
  const plants = [
    { name: 'Tomato', emoji: '🍅' },
    { name: 'Potato', emoji: '🥔' },
    { name: 'Apple', emoji: '🍎' },
    { name: 'Corn', emoji: '🌽' },
    { name: 'Grape', emoji: '🍇' },
    { name: 'Cherry', emoji: '🍒' },
    { name: 'Blueberry', emoji: '🫐' },
    { name: 'Orange', emoji: '🍊' }
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 transition-all duration-1000">
      <div className="max-w-6xl mx-auto">
        <div className={`backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700`} style={{backgroundColor: 'rgba(20, 34, 22, 0.9)'}}>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Supported <span className="text-green-400">Plant Species</span>
            </h2>
            <p className="text-gray-300">Currently supported (more coming soon)</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {plants.map((plant, index) => (
              <div 
                key={index}
                className={`text-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-700 hover:scale-105 hover:shadow-lg ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{transitionDelay: `${index * 150}ms`}}
              >
                <div className="text-3xl mb-2">{plant.emoji}</div>
                <p className="text-white text-sm font-medium">{plant.name}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-green-300 font-semibold">+ 6 more species • 38 disease types detected</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SupportedPlants
