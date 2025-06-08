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

const ResourcesModal = ({ onClose }) => {
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
}

export default ResourcesModal