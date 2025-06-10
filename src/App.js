import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Componente para proteger rotas que exigem autenticação
export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, currentUser, isLoading, hasAdminAccess } = useAuth();
  const location = useLocation();
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Carregando...</h2>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    sessionStorage.setItem('redirectUrl', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check admin access for admin-only routes
  if (adminOnly && !hasAdminAccess()) {
    // Log unauthorized access attempt
    console.warn(`Unauthorized access attempt to ${location.pathname} by user ${currentUser?.email}`);
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return <Outlet />;
}

export default App; 