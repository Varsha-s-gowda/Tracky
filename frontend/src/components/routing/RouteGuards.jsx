import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageLoader } from '../ui/Loaders';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
