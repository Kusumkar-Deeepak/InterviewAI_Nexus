import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const ModalWrapper = ({ children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
        >
          <FiX className="h-5 w-5 text-gray-500" />
        </button>
        <div className="p-8">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const FeaturesModal = ({ onClose }) => {
  return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Key Features</h2>
        <p className="text-gray-600">Discover what makes InterviewAI Nexus unique</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {[
          {
            title: "AI-Powered Interviews",
            description: "Our advanced AI conducts realistic interviews with natural language processing",
            icon: "🤖"
          },
          {
            title: "Real-Time Feedback",
            description: "Get instant analysis on your responses, tone, and body language",
            icon: "⏱️"
          },
          {
            title: "Customizable Questions",
            description: "Tailor interviews to specific job roles and industries",
            icon: "🎯"
          },
          {
            title: "Progress Tracking",
            description: "Monitor your improvement over time with detailed analytics",
            icon: "📊"
          },
        ].map((feature, index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-lg">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

export const PricingModal = ({ onClose }) => {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for individuals getting started",
      features: [
        "5 interviews per month",
        "Basic feedback",
        "Email support",
        "Limited question bank"
      ],
      cta: "Get Started Free"
    },
    {
      name: "Professional",
      price: "$29",
      description: "For serious job seekers",
      features: [
        "Unlimited interviews",
        "Advanced feedback",
        "Priority support",
        "Full question bank",
        "Custom interview setups"
      ],
      cta: "Choose Professional",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: [
        "Everything in Professional",
        "Team management",
        "Dedicated account manager",
        "Custom integrations",
        "API access"
      ],
      cta: "Contact Sales"
    }
  ];

  return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Simple, Transparent Pricing</h2>
        <p className="text-gray-600">Choose the plan that works best for you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div 
            key={index} 
            className={`relative rounded-xl p-6 border ${plan.popular ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-3xl font-bold mb-2">{plan.price}{!isNaN(plan.price[1]) && <span className="text-lg text-gray-500">/mo</span>}</p>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2 px-4 rounded-lg font-medium ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50'}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

export const ResourcesModal = ({ onClose }) => {
  const resources = [
    {
      title: "Interview Preparation Guide",
      type: "Guide",
      description: "Comprehensive guide to acing any job interview",
      link: "#"
    },
    {
      title: "Common Interview Questions",
      type: "Cheat Sheet",
      description: "List of frequently asked questions by industry",
      link: "#"
    },
    {
      title: "Body Language Tips",
      type: "Video",
      description: "Master non-verbal communication for interviews",
      link: "#"
    },
    {
      title: "Salary Negotiation",
      type: "E-book",
      description: "Strategies to get the compensation you deserve",
      link: "#"
    }
  ];

  return (
    <ModalWrapper onClose={onClose}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Helpful Resources</h2>
        <p className="text-gray-600">Tools and materials to boost your interview skills</p>
      </div>

      <div className="space-y-6">
        {resources.map((resource, index) => (
          <div key={index} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="bg-indigo-100 text-indigo-800 rounded-lg p-3 mr-4">
              {resource.type === "Guide" && "📖"}
              {resource.type === "Cheat Sheet" && "📋"}
              {resource.type === "Video" && "🎬"}
              {resource.type === "E-book" && "📚"}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{resource.title}</h3>
              <p className="text-gray-600 mb-2">{resource.description}</p>
              <a href={resource.link} className="text-indigo-600 hover:text-indigo-800 font-medium">
                View {resource.type.toLowerCase()} →
              </a>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};