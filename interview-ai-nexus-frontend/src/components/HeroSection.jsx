import { motion } from 'framer-motion';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const HeroSection = ({ isAuthenticated, user }) => {
  const { loginWithRedirect } = useAuth0();

  const handleGetStarted = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
      // Remove the returnTo parameter to stay on home page after login
    });
  };

  return (
    <section className="relative bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl"
          >
            InterviewAI Nexus
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-5 max-w-xl mx-auto text-xl text-gray-500"
          >
            The smart way to prepare for your next job interview
          </motion.p>
          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-8"
            >
              <p className="text-lg text-gray-600">
                Welcome back, {user?.name || user?.email?.split('@')[0]}!
              </p>
              <Link
                to="/dashboard"
                className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-8"
            >
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="bg-indigo-50 p-8 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Key Benefits
              </h2>
              <ul className="space-y-4">
                {[
                  "Reduces hiring time by 70%",
                  "Eliminates unconscious bias",
                  "Scalable for any company size",
                  "Detailed candidate analytics",
                ].map((item, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (index * 0.1), duration: 0.5 }}
                  >
                    <FiCheck className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-gray-50 p-8 rounded-xl border border-gray-200"
          >
            <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">
              Ready to revolutionize your hiring?
            </h3>
            <div className="space-y-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  Go to Dashboard <FiArrowRight className="ml-2" />
                </Link>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  Get Started <FiArrowRight className="ml-2" />
                </button>
              )}
              <p className="text-center text-gray-500 text-sm">
                No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;