import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // If no token, kick them to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If it's an admin route and they aren't an admin, kick them to the user dashboard
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, let them in
  return children;
}

export default ProtectedRoute;