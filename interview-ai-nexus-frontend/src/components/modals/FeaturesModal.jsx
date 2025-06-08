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

const FeaturesModal = ({ onClose }) => {
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
}

export default FeaturesModal

