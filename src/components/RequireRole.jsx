// src/components/RequireRole.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export default function RequireRole({ allowedRoles, children }) {
  const { user, loading, getUserRole } = useAuth();

  if (loading) {
    return <div className="rr-loading">Yuklanmoqda...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}