// App.js
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth0 } from "@auth0/auth0-react";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Loading from "./components/Loading";
import InterviewAccess from "./pages/InterviewAccess";
import InterviewPermission from "./pages/InterviewPermission";
import InterviewScreen from "./pages/InterviewScreen";
import ProtectedInterviewRoute from "./components/ProtectedInterviewRoute";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const background = location.state?.background;

  // Show Navbar only on / and /dashboard routes
  const showNavbar =
    location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-white">
      {showNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={background || location}>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:interviewLink"
            element={<InterviewAccess />}
          />
          <Route
            path="/interview/:interviewLink/permission"
            element={
              <ProtectedInterviewRoute>
                <InterviewPermission />
              </ProtectedInterviewRoute>
            }
          />
          <Route
            path="/interview/:interviewLink/start"
            element={
              <ProtectedInterviewRoute>
                <div className="bg-gray-900 h-screen">
                  <InterviewScreen />
                </div>
              </ProtectedInterviewRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
