// frontend/src/components/common/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;