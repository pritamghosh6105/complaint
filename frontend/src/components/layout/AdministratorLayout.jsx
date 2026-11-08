import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from '../common/Footer';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  LayoutDashboard, 
  Flame, 
  BrainCircuit, 
  Building2 
} from 'lucide-react';

export default function AdministratorLayout({ 
  currentRoute, 
  setCurrentRoute, 
  children,
  onGlobalSearch 
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Administrator Mobile Bottom Navigation
  const adminBottomNavItems = [
    { id: 'admin-dashboard', label: 'Admin', icon: LayoutDashboard, highlight: true },
    { id: 'gis-heatmap', label: 'Heatmap', icon: Flame },
    { id: 'ml-inspector', label: 'ML Micro', icon: BrainCircuit },
    { id: 'departments', label: 'Depts', icon: Building2 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Top Application Header */}
      <Header
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        onGlobalSearch={onGlobalSearch}
      />

      {/* Main Workspace with Administrator Sidebar */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          currentRoute={currentRoute}
          setCurrentRoute={setCurrentRoute}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main 
          className="app-main-content"
          style={{ 
            flex: 1, 
            minWidth: 0,
            display: 'flex', 
            flexDirection: 'column'
          }}
        >
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar (Administrator) */}
      <nav 
        className="mobile-only mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 1000,
          padding: '0 8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
        aria-label="Administrator mobile navigation"
      >
        {adminBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentRoute(item.id)}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--nav-item-active, #38bdf8)' : 'var(--text-muted)',
                cursor: 'pointer',
                flex: 1,
                padding: '6px 0',
                minWidth: 0
              }}
            >
              <Icon size={item.highlight ? 22 : 19} color={isActive ? (item.highlight ? '#10b981' : 'var(--nav-item-active, #38bdf8)') : undefined} />
              <span style={{ 
                fontSize: '0.68rem', 
                fontWeight: isActive ? 700 : 500, 
                whiteSpace: 'nowrap',
                color: isActive ? 'var(--nav-item-active, #38bdf8)' : 'var(--text-muted)'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

