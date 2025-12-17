import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading only if still checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  // If authenticated (check both user and isAuthenticated for safety)
  if (user || isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />;
};

