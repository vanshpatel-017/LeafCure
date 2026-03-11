import React from 'react'
import { FaStar, FaComment } from 'react-icons/fa'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Home Gardener',
    content: 'LeafCure saved my tomato plants! I caught the blight early thanks to the instant diagnosis. The treatment recommendations were spot on.',
    rating: 5,
    avatar: 'SJ',
    color: 'bg-green-500',
  },
  {
    name: 'Dr. Michael Chen',
    role: 'Agricultural Researcher',
    content: 'The dual AI model approach is impressive. I use it in my research to validate findings. The accuracy is consistently above 95%.',
    rating: 5,
    avatar: 'MC',
    color: 'bg-emerald-500',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Commercial Farmer',
    content: 'We\'ve started using LeafCure on our small farm and it\'s already helping us catch issues early. Great potential for scaling up.',
    rating: 5,
    avatar: 'ER',
    color: 'bg-emerald-500',
  },
]

const TestimonialCard = ({ testimonial, index }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 })

  return (
    <div
      ref={ref}
      className={`glass-card p-6 hover-lift group relative transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <FaComment className="absolute top-4 right-4 w-8 h-8 text-green-400/10 group-hover:text-green-400/20 transition-colors" />

      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <FaStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
      </div>

      <p className="text-gray-300 mb-6 leading-relaxed">
        "{testimonial.content}"
      </p>

      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-semibold`}>
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-semibold text-white">{testimonial.name}</p>
          <p className="text-sm text-gray-400">{testimonial.role}</p>
        </div>
      </div>
    </div>
  )
}

const TestimonialsSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()

  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            What Our <span className="gradient-text">Users Say</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            See what early users are saying about LeafCure
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
