import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import StudentPortal from './pages/StudentPortal';
import LecturerPortal from './pages/LecturerPortal';
import AdminPortal from './pages/AdminPortal';

// Route guard component to check login state and role permissions
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-main)',
        fontSize: '1.25rem'
      }}>
        Loading academic portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Treat 'instructor' and 'lecturer' as equivalent
  const userRole = user.role === 'instructor' ? 'lecturer' : user.role;
  const targetRole = requiredRole === 'instructor' ? 'lecturer' : requiredRole;

  if (targetRole && userRole !== targetRole) {
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }

  return children;
};

// Redirects users visiting generic /dashboard to their specific role dashboard
const DashboardRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-main)',
        fontSize: '1.25rem'
      }}>
        Loading academic portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role === 'instructor' ? 'lecturer' : user.role;
  return <Navigate to={`/${role}/dashboard`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Redirection Route */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Protected Portal Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute requiredRole="lecturer">
                <LecturerPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
