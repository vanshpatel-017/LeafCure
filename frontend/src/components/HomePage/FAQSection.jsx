import React, { useState } from 'react'
import { FaChevronDown, FaQuestionCircle } from 'react-icons/fa'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

const faqs = [
  {
    question: "How accurate is LeafCure's disease detection?",
    answer: "LeafCure uses dual AI models (Vision Transformer and Swin Transformer) that achieve an average accuracy of 95.8% across 38+ plant diseases. Our models are continuously trained on new data to improve accuracy.",
  },
  {
    question: "What types of plants can LeafCure diagnose?",
    answer: "Currently, LeafCure supports 14+ plant species including tomatoes, potatoes, peppers, corn, grapes, apples, and more. We're constantly adding support for new plant species based on user requests.",
  },
  {
    question: "How long does the diagnosis take?",
    answer: "Our AI provides instant results in under 3 seconds. Simply upload a clear photo of the affected leaf, and you'll receive a detailed diagnosis with treatment recommendations immediately.",
  },
  {
    question: "Is LeafCure free to use?",
    answer: "Yes! LeafCure offers a free tier with basic diagnosis features. For advanced features like historical tracking, detailed analytics, and priority support, we offer affordable premium plans.",
  },
  {
    question: "Can I use LeafCure for commercial farming?",
    answer: "Absolutely! Many commercial farmers use LeafCure to monitor crop health across large-scale operations. Our enterprise plans include API access, bulk analysis, and dedicated support.",
  },
  {
    question: "What image quality is required for accurate diagnosis?",
    answer: "For best results, upload a clear, well-lit photo of the affected leaf. The image should be in focus and show the symptoms clearly. Avoid blurry or dark images for optimal accuracy.",
  },
]

const FAQItem = ({ faq, index }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 -translate-x-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="glass-card border border-white/10 overflow-hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left px-6 py-6 text-white hover:text-green-400 transition-colors text-base sm:text-lg font-medium flex justify-between items-center"
        >
          {faq.question}
          <FaChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="px-6 pb-6 text-gray-300 leading-relaxed animate-fade-in">
            {faq.answer}
          </div>
        )}
      </div>
    </div>
  )
}

const FAQSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-4">
            <FaQuestionCircle className="w-4 h-4" />
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about LeafCure
          </p>
        </div>

        <div>
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQSection
