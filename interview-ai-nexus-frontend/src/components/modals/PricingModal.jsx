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

import React from 'react'

const PricingModal = ({ onClose }) => {
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
}

export default PricingModal;
