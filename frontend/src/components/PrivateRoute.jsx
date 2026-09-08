// frontend/src/components/PrivateRoute.jsx

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, token } = useSelector((state) => state.auth);

  // User is not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check user role if specific roles are required
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.user_type)
  ) {
    const redirectPath =
      user.user_type === 'teacher'
        ? '/teacher/dashboard'
        : '/student/dashboard';

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;