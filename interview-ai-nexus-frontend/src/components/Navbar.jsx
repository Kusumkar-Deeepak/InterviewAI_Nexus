import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiArrowRight, FiUser, FiLogOut, FiHome } from 'react-icons/fi';
import { useAuth0 } from '@auth0/auth0-react';
import FeaturesModal from './modals/FeaturesModal';
import PricingModal from './modals/PlanManagementModal';
import ResourcesModal from './modals/ResourcesModal';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();
  const { 
    loginWithRedirect, 
    logout, 
    isAuthenticated, 
    user, 
    isLoading,
    getAccessTokenSilently
  } = useAuth0();

  const navLinks = [
    { name: "Features", modal: "features" },
    { name: "Pricing", modal: "pricing" },
    { name: "Resources", modal: "resources" },
  ];

  const handleLogin = async () => {
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: "login",
      },
    });
  };

  const handleSignUp = async () => {
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setMobileMenuOpen(false);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Check authentication status (no automatic redirect)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getAccessTokenSilently();
      } catch (error) {
        console.log("User not authenticated");
      }
    };
    checkAuth();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  if (isLoading) {
    return <div className="h-20 bg-white border-b border-gray-100 shadow-sm"></div>;
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex flex-col items-start leading-tight">
  <Link to="/" className="flex items-center space-x-1">
    <span className="text-2xl font-bold text-indigo-600">InterviewAI</span>
    <span className="text-2xl font-bold text-gray-800">Nexus</span>
  </Link>
  <span className="text-sm text-gray-500 mt-0.5">Next-Gen AI Interviews for Modern Hiring</span>
</div>


            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => openModal(link.modal)}
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {link.name}
                </button>
              ))}

              <div className="flex items-center space-x-4 ml-6">
                {isAuthenticated ? (
                  <div className="relative user-dropdown">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      {user?.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FiUser className="text-indigo-600" />
                        </div>
                      )}
                      <span className="text-gray-700 text-sm font-medium">
                        {user?.name || user?.email?.split('@')[0]}
                      </span>
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <FiHome className="mr-2" /> Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FiLogOut className="mr-2" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={handleSignUp}
                      className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Get Started <FiArrowRight className="ml-1" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg">
            <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => openModal(link.modal)}
                  className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                >
                  {link.name}
                </button>
              ))}

              <div className="pt-2 border-t border-gray-200 mt-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center px-4 py-3">
                      {user?.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full mr-3 object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          <FiUser className="text-indigo-600" />
                        </div>
                      )}
                      <span className="text-gray-700 text-base font-medium">
                        {user?.name || user?.email?.split('@')[0]}
                      </span>
                    </div>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-3 text-left rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleSignUp();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left rounded-md text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors mt-2"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Modals */}
      {activeModal === 'features' && <FeaturesModal onClose={closeModal} />}
      {activeModal === 'pricing' && <PricingModal onClose={closeModal} userEmail={user?.email}/>}
      {activeModal === 'resources' && <ResourcesModal onClose={closeModal} />}
    </>
  );
};

export default Navbar;