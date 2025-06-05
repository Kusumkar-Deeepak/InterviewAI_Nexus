import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const CtaSection = ({ isAuthenticated }) => {
  const { loginWithRedirect } = useAuth0();

  const handleGetStarted = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  return (
    <section className="py-20 px-4 bg-indigo-600">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Get started with InterviewAI Nexus today and experience the future of recruitment
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Go to Dashboard <FiArrowRight />
              </Link>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  Start Free Trial <FiArrowRight />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  Schedule Demo
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;