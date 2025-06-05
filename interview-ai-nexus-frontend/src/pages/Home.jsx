import { useAuth0 } from '@auth0/auth0-react';
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import Testimonials from "../components/Testimonials";
import CtaSection from "../components/CtaSection";

const Home = () => {
  const { isAuthenticated, user } = useAuth0();

  return (
    <div className="bg-white">
      <HeroSection isAuthenticated={isAuthenticated} user={user} />
      <FeaturesSection />
      <Testimonials />
      <CtaSection isAuthenticated={isAuthenticated} />
    </div>
  );
};

export default Home;