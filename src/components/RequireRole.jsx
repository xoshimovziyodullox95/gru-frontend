// src/components/RequireRole.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import { T } from './utils/T';
export default function RequireRole({ allowedRoles, children }) {
  const { user, loading, getUserRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="rr-loading">{T('Yuklanmoqda...')}</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = getUserRole();
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}