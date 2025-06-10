import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import CompanyManagement from './pages/CompanyManagement';
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
      },
      {
        path: 'companies',
        element: <ProtectedRoute adminOnly={true}><CompanyManagement /></ProtectedRoute>
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