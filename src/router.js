import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthProvider><App /></AuthProvider>,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: '/',
        element: <ProtectedRoute><Home /></ProtectedRoute>
      },
      {
        path: 'admin',
        element: <ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_normalizeFormMethod: true
  }
});

export default router; 