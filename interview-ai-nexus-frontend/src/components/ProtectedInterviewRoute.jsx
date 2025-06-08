// ProtectedInterviewRoute.js
import { useParams, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Loading from './Loading';

const ProtectedInterviewRoute = ({ children }) => {
  const { interviewLink } = useParams();
  const { isLoading } = useAuth0();
  const storedToken = localStorage.getItem(`interviewToken-${interviewLink}`);

  if (isLoading) {
    return <Loading />;
  }

  if (!storedToken) {
    return <Navigate to={`/interview/${interviewLink}`} replace />;
  }

  return children;
};

export default ProtectedInterviewRoute;