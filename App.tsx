import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MemberDashboard from './pages/MemberDashboard';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MemberManagement from './pages/MemberManagement';
import AdminPros from './pages/AdminPros';
import AdminFinance from './pages/AdminFinance';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  const handleLogin = (role: 'admin' | 'member' = 'admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'member' ? "/filhos" : "/admin"} replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <Routes>
                <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
                <Route path="/members" element={<MemberManagement onLogout={handleLogout} />} />
                <Route path="/pros" element={<AdminPros onLogout={handleLogout} />} />
                <Route path="/finance" element={<AdminFinance onLogout={handleLogout} />} />
                <Route path="*" element={<Dashboard onLogout={handleLogout} />} />
              </Routes>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Member Routes */}
        <Route
          path="/filhos/*"
          element={
            isAuthenticated && (userRole === 'member' || userRole === 'admin') ? (
              <Routes>
                <Route path="/" element={<MemberDashboard onLogout={handleLogout} userRole={userRole} />} />
                <Route path="*" element={<MemberDashboard onLogout={handleLogout} userRole={userRole} />} />
              </Routes>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
