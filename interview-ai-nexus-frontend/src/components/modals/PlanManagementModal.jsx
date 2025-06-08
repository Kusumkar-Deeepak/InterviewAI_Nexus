import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiZap, FiStar, FiAward, FiXCircle } from 'react-icons/fi';
import axios from '../../services/axios';

const PlanCard = ({ plan, currentPlan, onSelect, loading }) => {
  const isCurrent = plan.name === currentPlan;
  const isFree = plan.name === 'Free';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative border rounded-xl p-6 ${isCurrent ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
    >
      {isCurrent && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          Current Plan
        </div>
      )}
      
      <div className="flex items-center mb-4">
        {plan.name === 'Pro' && <FiZap className="w-6 h-6 text-indigo-600 mr-2" />}
        {plan.name === 'Free' && <FiStar className="w-6 h-6 text-gray-500 mr-2" />}
        {plan.name === 'Enterprise' && <FiAward className="w-6 h-6 text-purple-600 mr-2" />}
        <h3 className="text-xl font-bold">{plan.name}</h3>
      </div>
      
      <div className="mb-6">
        <span className="text-3xl font-bold">${plan.price}</span>
        <span className="text-gray-500">/{plan.interval}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center">
            {feature.available ? (
              <FiCheck className="text-green-500 mr-2" />
            ) : (
              <FiX className="text-gray-300 mr-2" />
            )}
            <span className={feature.available ? 'text-gray-800' : 'text-gray-400'}>{feature.text}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={() => !isCurrent && onSelect(plan.name)}
        disabled={isCurrent || isFree || loading}
        className={`w-full py-2 px-4 rounded-lg font-medium ${
          isCurrent 
            ? 'bg-indigo-100 text-indigo-700 cursor-default' 
            : isFree
              ? 'bg-gray-100 text-gray-500 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isCurrent ? 'Current Plan' : isFree ? 'Your Free Plan' : loading ? 'Processing...' : 'Upgrade'}
      </button>
    </motion.div>
  );
};

const PlanManagementModal = ({ onClose, userEmail }) => {
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const plans = [
    {
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        { text: '3 interviews per month', available: true },
        { text: 'Basic interview types', available: true },
        { text: 'Standard question bank', available: true },
        { text: 'Email support', available: false },
        { text: 'Advanced analytics', available: false },
      ]
    },
    {
      name: 'Pro',
      price: 29,
      interval: 'month',
      features: [
        { text: '15 interviews per month', available: true },
        { text: 'All interview types', available: true },
        { text: 'Premium question bank', available: true },
        { text: 'Priority email support', available: true },
        { text: 'Basic analytics', available: true },
      ]
    },
    {
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      features: [
        { text: 'Unlimited interviews', available: true },
        { text: 'All interview types', available: true },
        { text: 'Custom question bank', available: true },
        { text: '24/7 support', available: true },
        { text: 'Advanced analytics', available: true },
      ]
    }
  ];

  useEffect(() => {
  const fetchUserPlan = async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/user/plan', {
        email: userEmail
      });

      setCurrentPlan(response.data.plan || 'Free');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchUserPlan();
}, [userEmail]);

const handlePlanSelect = async (planName) => {
  if (!userEmail) {
    setError('Please login to upgrade your plan');
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const response = await axios.put('/api/user/plan', {
      email: userEmail,
      plan: planName
    });

    setCurrentPlan(response.data.plan);
    setSuccess(`Successfully upgraded to ${response.data.plan} plan!`);
    setTimeout(() => setSuccess(null), 3000);
  } catch (err) {
    setError(err.response?.data?.error || err.message);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
              <p className="text-gray-600">
                {userEmail 
                  ? currentPlan === 'Free' 
                    ? 'You are currently on the Free plan' 
                    : `Your current plan: ${currentPlan}`
                  : 'Login to manage your subscription'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            >
              <FiXCircle className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, index) => (
              <PlanCard 
                key={index}
                plan={plan}
                currentPlan={currentPlan}
                onSelect={handlePlanSelect}
                loading={loading}
              />
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Plan Features Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Feature</th>
                    {plans.map((plan, i) => (
                      <th key={i} className="text-center py-3">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans[0].features.map((_, featureIndex) => (
                    <tr key={featureIndex} className="border-b">
                      <td className="py-3">{plans[0].features[featureIndex].text}</td>
                      {plans.map((plan, planIndex) => (
                        <td key={planIndex} className="text-center py-3">
                          {plan.features[featureIndex].available ? (
                            <FiCheck className="inline text-green-500" />
                          ) : (
                            <FiX className="inline text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanManagementModal;