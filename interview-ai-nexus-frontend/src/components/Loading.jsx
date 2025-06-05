import { motion } from 'framer-motion';

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          ease: "linear",
          repeat: Infinity,
        }}
        className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent"
      >
        <span className="sr-only">Loading...</span>
      </motion.div>
    </div>
  );
};

export const InlineLoading = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, ease: "linear", repeat: Infinity }}
      className={`rounded-full border-4 border-indigo-500 border-t-transparent ${sizes[size]}`}
    >
      <span className="sr-only">Loading...</span>
    </motion.div>
  );
};

export default Loading;