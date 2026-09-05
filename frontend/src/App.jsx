import React, { useState } from 'react';
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

function AppContent() {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('home');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const renderRoute = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <Home 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'login':
        return <Login setCurrentRoute={setCurrentRoute} />;
      case 'register':
        return <Register setCurrentRoute={setCurrentRoute} />;
      case 'citizen-dashboard':
        return (
          <CitizenDashboard 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'new-complaint':
        return (
          <NewComplaint 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'complaint-details':
        return (
          <ComplaintDetails 
            complaintId={selectedComplaintId} 
            setCurrentRoute={setCurrentRoute} 
          />
        );
      case 'officer-dashboard':
        return (
          <OfficerDashboard 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'gis-heatmap':
        return (
          <HeatmapPage 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
      case 'ml-inspector':
        return <MLInspector setCurrentRoute={setCurrentRoute} />;
      case 'departments':
        return <DepartmentsPage setCurrentRoute={setCurrentRoute} />;
      default:
        return (
          <Home 
            setCurrentRoute={setCurrentRoute} 
            setSelectedComplaintId={setSelectedComplaintId} 
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />
      <main style={{ flex: 1 }}>
        {renderRoute()}
      </main>
      <Footer />
    </div>
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
