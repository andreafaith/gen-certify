import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!session) {
    // Redirect to login if not authenticated, but preserve the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if session is expired
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
