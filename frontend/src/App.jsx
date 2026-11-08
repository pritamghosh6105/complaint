import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import NewComplaint from './pages/citizen/NewComplaint';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import HeatmapPage from './pages/admin/HeatmapPage';
import MLInspector from './pages/admin/MLInspector';
import DepartmentsPage from './pages/DepartmentsPage';

import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/common/ErrorBoundary';

function getInitialRoute() {
  try {
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const r = hash || path;
    if (r === 'auth' || r === 'login' || r === 'signin') return 'login';
    if (r === 'register' || r === 'signup') return 'register';
    if (['citizen-dashboard', 'new-complaint', 'complaint-details', 'officer-dashboard', 'admin-dashboard', 'gis-heatmap', 'ml-inspector', 'departments'].includes(r)) {
      return r;
    }
  } catch (e) {}
  return 'home';
}

function AppContent() {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const handleSetRoute = (route) => {
    setCurrentRoute(route);
    try {
      const targetPath = route === 'home' ? '/' : `/${route}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ route }, '', targetPath);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Global testing hook
    window.__CIVICPULSE_NAVIGATE__ = (route, complaintId = null) => {
      if (complaintId !== null) setSelectedComplaintId(complaintId);
      handleSetRoute(route);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      delete window.__CIVICPULSE_NAVIGATE__;
    };
  }, []);

  useEffect(() => {
    // Role-based route guard: Officers must never access citizen reporting routes
    if (user && user.role === 'officer') {
      if (currentRoute === 'new-complaint' || currentRoute === 'citizen-dashboard') {
        handleSetRoute('officer-dashboard');
      }
    }
  }, [user, currentRoute]);

  const renderRoute = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <Home 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'login':
        return <Login setCurrentRoute={handleSetRoute} />;
      case 'register':
        return <Register setCurrentRoute={handleSetRoute} />;
      case 'citizen-dashboard':
        if (!user) {
          return (
            <Login 
              setCurrentRoute={handleSetRoute} 
              authNotice="Please sign in to view and track your registered civic complaints."
            />
          );
        }
        if (user.role === 'officer') {
          return (
            <OfficerDashboard 
              setCurrentRoute={handleSetRoute} 
              setSelectedComplaintId={setSelectedComplaintId} 
            />
          );
        }
        return (
          <CitizenDashboard 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'new-complaint':
        if (!user) {
          return (
            <Login 
              setCurrentRoute={handleSetRoute} 
              onSuccessRoute="new-complaint"
              authNotice="Please sign in to your Citizen account to report a civic issue."
            />
          );
        }
        if (user.role === 'officer') {
          return (
            <OfficerDashboard 
              setCurrentRoute={handleSetRoute} 
              setSelectedComplaintId={setSelectedComplaintId} 
              roleNotice="Citizen complaint reporting is restricted to citizen accounts. You have been redirected to your operational field queue."
            />
          );
        }
        return (
          <NewComplaint 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'complaint-details':
        return (
          <ComplaintDetails 
            complaintId={selectedComplaintId} 
            setCurrentRoute={handleSetRoute} 
          />
        );
      case 'officer-dashboard':
        if (!user || (user.role !== 'officer' && user.role !== 'admin')) {
          return <Home setCurrentRoute={handleSetRoute} setSelectedComplaintId={setSelectedComplaintId} />;
        }
        return (
          <OfficerDashboard 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'admin-dashboard':
        if (!user || user.role !== 'admin') {
          return <Home setCurrentRoute={handleSetRoute} setSelectedComplaintId={setSelectedComplaintId} />;
        }
        return (
          <AdminDashboard 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'gis-heatmap':
        if (!user || user.role !== 'admin') {
          return <Home setCurrentRoute={handleSetRoute} setSelectedComplaintId={setSelectedComplaintId} />;
        }
        return (
          <HeatmapPage 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'ml-inspector':
        if (!user || user.role !== 'admin') {
          return <Home setCurrentRoute={handleSetRoute} setSelectedComplaintId={setSelectedComplaintId} />;
        }
        return <MLInspector setCurrentRoute={handleSetRoute} />;
      case 'departments':
        return <DepartmentsPage setCurrentRoute={handleSetRoute} />;
      default:
        return (
          <Home 
            setCurrentRoute={handleSetRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
    }
  };

  return (
    <AppShell currentRoute={currentRoute} setCurrentRoute={handleSetRoute}>
      <ErrorBoundary onReset={() => handleSetRoute('home')}>
        {renderRoute()}
      </ErrorBoundary>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
