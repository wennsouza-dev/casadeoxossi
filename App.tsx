
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MemberDashboard from './pages/MemberDashboard';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MemberManagement from './pages/MemberManagement';

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
          element={isAuthenticated ? <Navigate to="/admin" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/admin"
          element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/members"
          element={isAuthenticated ? <MemberManagement onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
